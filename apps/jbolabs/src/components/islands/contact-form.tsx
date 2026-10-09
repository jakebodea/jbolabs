import { actions, isInputError } from "astro:actions";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, Ref, SubmitEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/choice-chip";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUDGETS, SERVICES, TIMELINES } from "@/lib/intake-options";
import { currentReferrer } from "@/lib/referral";
import { cn } from "@/lib/utils";

import { loadTurnstile } from "./turnstile";

interface ContactFormProps {
  /** Public Turnstile site key (Cloudflare's always-pass test key outside prod). */
  readonly turnstileSiteKey: string;
}

type Status =
  | { readonly state: "idle" }
  | { readonly state: "sending" }
  | { readonly state: "sent"; readonly name: string; readonly email: string }
  | { readonly state: "error"; readonly message: string };

/** Field name to the message shown under it; absent when the field is fine. */
type Errors = Readonly<Partial<Record<string, string>>>;

/**
 * The form is one <form> split into steps: every step stays mounted (hidden
 * when inactive) so FormData sees all fields, and each step's fields are
 * checked against their own constraints before moving on, with the message
 * shown under the field rather than in a browser bubble. The easy, engaging
 * questions come first; contact details come last. Titles render lowercase
 * (the `display` style), so they avoid "I".
 */
const STEPS = [
  { note: null, title: "what are you working on?" },
  {
    note: "Both optional. A rough idea helps me suggest the right scope.",
    title: "when, and roughly how much?",
  },
  {
    note: "I read every note myself and reply within two business days.",
    title: "where should my reply go?",
  },
] as const;
const LAST = STEPS.length - 1;

/** How long a send waits for the invisible spam check before giving up. */
const TOKEN_TIMEOUT_MS = 15_000;

const field = (data: FormData, name: string): string => {
  const value = data.get(name);
  return value === null || value instanceof File ? "" : value;
};

const optional = (value: string) => (value.trim() === "" ? undefined : value);

/** Narrows a submitted radio value to one of its listed options. */
const choice = <T extends string>(
  options: readonly T[],
  value: string
): T | undefined => options.find((option) => option === value);

const Optional = () => (
  <span className="text-muted-foreground font-normal">(optional)</span>
);

type Validated = HTMLInputElement | HTMLTextAreaElement;

/** A friendly message for an invalid field, in the site's voice. */
const messageFor = (element: Validated): string => {
  const { validity } = element;
  switch (element.name) {
    case "message": {
      return validity.valueMissing
        ? "Tell me a little about the project."
        : "Add a few more words so I know where to start.";
    }
    case "name": {
      return validity.valueMissing
        ? "What should I call you?"
        : "That name looks a little short.";
    }
    case "email": {
      return validity.valueMissing
        ? "I need an email address to reply to."
        : "That email address does not look quite right.";
    }
    default: {
      return element.validationMessage;
    }
  }
};

/** Checks every field in a step: field name to message, empty when the step is complete. */
const validate = (step: HTMLElement | null) => {
  const fields = [
    ...(step?.querySelectorAll<Validated>("input, textarea") ?? []),
  ];
  const found = new Map<string, string>();
  for (const element of fields) {
    if (!element.checkValidity()) {
      found.set(element.name, messageFor(element));
    }
  }
  return found;
};

/** The field an input event came from, when it is one the form validates. */
const validatedTarget = (target: EventTarget): Validated | null =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    ? target
    : null;

const firstName = (name: string) => name.trim().split(/\s+/u)[0] ?? "";

/** Props that tie an input to its error message. */
const invalidProps = (errors: Errors, name: string, id: string) =>
  errors[name] === undefined
    ? {}
    : { "aria-describedby": `${id}-error`, "aria-invalid": true };

/** A step slides in from the side it lies on: from the right going forward, from the left going back. */
const Step = ({
  index,
  current,
  back,
  stepRef,
  children,
}: {
  readonly index: number;
  readonly current: number;
  readonly back: boolean;
  readonly stepRef: (element: HTMLElement | null) => void;
  readonly children: ReactNode;
}) => (
  <section
    ref={stepRef}
    hidden={index !== current}
    aria-labelledby={`intake-step-${index}`}
    className={cn(
      "animate-in fade-in ease-out-expo flex flex-col gap-8 duration-250",
      back ? "slide-in-from-left-3" : "slide-in-from-right-3"
    )}
  >
    <div className="flex flex-col gap-3">
      <h2
        id={`intake-step-${index}`}
        tabIndex={-1}
        className="display text-3xl outline-none sm:text-4xl"
      >
        {STEPS[index]?.title}
      </h2>
      {STEPS[index]?.note !== null && (
        <p className="text-muted-foreground leading-relaxed">
          {STEPS[index]?.note}
        </p>
      )}
    </div>
    {children}
  </section>
);

const Progress = ({ current }: { readonly current: number }) => (
  <div className="flex flex-col gap-3">
    <p className="text-muted-foreground text-sm" aria-live="polite">
      Step {current + 1} of {STEPS.length}
    </p>
    <div className="flex gap-1.5" aria-hidden="true">
      {STEPS.map((step, index) => (
        <span
          key={step.title}
          className="bg-input h-1 flex-1 overflow-hidden rounded-full"
        >
          <span
            className={cn(
              "bg-signal block h-full origin-left transition-transform duration-500 ease-out",
              index <= current ? "scale-x-100" : "scale-x-0"
            )}
          />
        </span>
      ))}
    </div>
  </div>
);

const ProjectFields = ({ errors }: { readonly errors: Errors }) => (
  <FieldGroup spacing="roomy">
    <FieldSet>
      <FieldLegend variant="label">
        What can I help with?{" "}
        <span className="text-muted-foreground font-normal">(pick any)</span>
      </FieldLegend>
      <div className="flex flex-wrap gap-2">
        {SERVICES.map((service) => (
          <ChoiceChip key={service} name="services" value={service}>
            {service}
          </ChoiceChip>
        ))}
      </div>
    </FieldSet>
    <Field data-invalid={errors.message !== undefined}>
      <FieldLabel htmlFor="intake-message">
        Tell me about the project
      </FieldLabel>
      <FieldDescription>
        A few sentences is perfect. Links are welcome.
      </FieldDescription>
      <Textarea
        id="intake-message"
        name="message"
        required
        minLength={10}
        maxLength={5000}
        rows={6}
        size="lg"
        placeholder="What are you hoping to build or change, and what does success look like?"
        {...invalidProps(errors, "message", "intake-message")}
      />
      {errors.message !== undefined && (
        <FieldError id="intake-message-error">{errors.message}</FieldError>
      )}
    </Field>
  </FieldGroup>
);

const BudgetFields = () => (
  <FieldGroup spacing="roomy">
    <FieldSet>
      <FieldLegend variant="label">Rough budget</FieldLegend>
      <div className="flex flex-wrap gap-2">
        {BUDGETS.map((budget) => (
          <ChoiceChip key={budget} type="radio" name="budget" value={budget}>
            {budget}
          </ChoiceChip>
        ))}
      </div>
    </FieldSet>
    <FieldSet>
      <FieldLegend variant="label">Timeline</FieldLegend>
      <div className="flex flex-wrap gap-2">
        {TIMELINES.map((timeline) => (
          <ChoiceChip
            key={timeline}
            type="radio"
            name="timeline"
            value={timeline}
          >
            {timeline}
          </ChoiceChip>
        ))}
      </div>
    </FieldSet>
  </FieldGroup>
);

/** Contact details, plus the invisible spam check that guards the final send. */
const AboutFields = ({
  errors,
  referrerRef,
  widgetRef,
}: {
  readonly errors: Errors;
  readonly referrerRef: Ref<HTMLInputElement>;
  readonly widgetRef: Ref<HTMLDivElement>;
}) => (
  <FieldGroup spacing="roomy">
    <div className="grid gap-6 sm:grid-cols-2">
      <Field data-invalid={errors.name !== undefined}>
        <FieldLabel htmlFor="intake-name">Your name</FieldLabel>
        <Input
          id="intake-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          size="lg"
          {...invalidProps(errors, "name", "intake-name")}
        />
        {errors.name !== undefined && (
          <FieldError id="intake-name-error">{errors.name}</FieldError>
        )}
      </Field>
      <Field data-invalid={errors.email !== undefined}>
        <FieldLabel htmlFor="intake-email">Email</FieldLabel>
        <Input
          id="intake-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          size="lg"
          placeholder="you@company.com"
          {...invalidProps(errors, "email", "intake-email")}
        />
        {errors.email !== undefined && (
          <FieldError id="intake-email-error">{errors.email}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="intake-company">
          Company <Optional />
        </FieldLabel>
        <Input
          id="intake-company"
          name="company"
          autoComplete="organization"
          maxLength={120}
          size="lg"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="intake-website">
          Current website <Optional />
        </FieldLabel>
        <Input
          id="intake-website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="example.com"
          maxLength={200}
          size="lg"
        />
      </Field>
    </div>
    <Field>
      <FieldLabel htmlFor="intake-referrer">
        Who referred you? <Optional />
      </FieldLabel>
      <Input
        id="intake-referrer"
        name="referrer"
        maxLength={120}
        size="lg"
        ref={referrerRef}
        placeholder="A name, so I can say thanks"
      />
    </Field>
    {/* Empty unless Cloudflare needs the visitor to click: the check normally runs unseen. */}
    <div ref={widgetRef} className="empty:hidden" />
  </FieldGroup>
);

const Sent = ({
  name,
  email,
  sentRef,
}: {
  readonly name: string;
  readonly email: string;
  readonly sentRef: Ref<HTMLOutputElement>;
}) => (
  // The one moment the form exists for: a short staggered entrance, with a
  // small overshoot on the check.
  <output
    ref={sentRef}
    tabIndex={-1}
    className="flex flex-col items-start gap-5 py-6 outline-none sm:py-10"
  >
    <span
      className="bg-signal-soft text-signal animate-in fade-in zoom-in-75 fill-mode-both ease-overshoot flex size-12 items-center justify-center rounded-full delay-100 duration-400"
      aria-hidden="true"
    >
      <CheckIcon className="size-5" strokeWidth={2.5} />
    </span>
    <h2 className="display animate-in fade-in slide-in-from-bottom-2 fill-mode-both ease-out-expo text-4xl leading-tight delay-60 duration-500 sm:text-5xl">
      Thanks, {firstName(name)}.{" "}
      <strong className="headline-strong">Your note is in.</strong>
    </h2>
    <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both ease-out-expo max-w-md text-lg leading-relaxed delay-120 duration-500">
      I read every enquiry personally and will reply to{" "}
      <span className="text-foreground font-medium break-words">{email}</span>{" "}
      within two business days.
    </p>
    <a
      href="/"
      className={cn(
        buttonVariants({ size: "cta", variant: "outline" }),
        "animate-in fade-in fill-mode-both ease-out-expo mt-3 delay-200 duration-500"
      )}
    >
      Back to the home page
    </a>
  </output>
);

/**
 * Cloudflare Turnstile, run invisibly once `active` (it only shows itself when
 * it needs a click). A send may arrive before the check finishes, so
 * `awaitToken` waits briefly for it; an empty string means it never came.
 */
const useSpamCheck = (siteKey: string, active: boolean) => {
  const widget = useRef<HTMLDivElement>(null);
  const token = useRef("");
  const tokenWaiters = useRef<((value: string) => void)[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = widget.current;
    let widgetId: string | undefined;
    let cancelled = false;
    const receive = (value: string) => {
      token.current = value;
      if (value !== "") {
        for (const resolve of tokenWaiters.current.splice(0)) {
          resolve(value);
        }
      }
    };
    const mount = async (target: HTMLDivElement) => {
      try {
        const turnstile = await loadTurnstile();
        if (cancelled) {
          return;
        }
        widgetId = turnstile.render(target, {
          appearance: "interaction-only",
          callback: receive,
          "error-callback": () => {
            receive("");
          },
          "expired-callback": () => {
            receive("");
          },
          sitekey: siteKey,
          size: "flexible",
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "light",
        });
      } catch {
        setFailed(true);
      }
    };
    if (active && element !== null) {
      void mount(element);
    }
    return () => {
      cancelled = true;
      if (widgetId !== undefined) {
        window.turnstile?.remove(widgetId);
      }
    };
  }, [siteKey, active]);

  const awaitToken = async (): Promise<string> => {
    if (token.current !== "") {
      return token.current;
    }
    const { promise, resolve } = Promise.withResolvers<string>();
    tokenWaiters.current.push(resolve);
    const timer = setTimeout(() => {
      resolve("");
    }, TOKEN_TIMEOUT_MS);
    const value = await promise;
    clearTimeout(timer);
    return value;
  };

  return { awaitToken, failed, widget };
};

/**
 * Per-field messages. `check` shows every problem in a step and focuses the
 * first; once a field has shown a message, `recheck` updates it as the visitor
 * types so it clears the moment the field is fixed.
 */
const useFieldErrors = () => {
  const [errors, setErrors] = useState<Errors>({});

  const check = (step: HTMLElement | null) => {
    const found = validate(step);
    setErrors(Object.fromEntries(found));
    const [first] = found.keys();
    if (first !== undefined) {
      step?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
    return first === undefined;
  };

  const recheck = (target: EventTarget) => {
    const element = validatedTarget(target);
    if (element === null || errors[element.name] === undefined) {
      return;
    }
    const message = element.checkValidity() ? undefined : messageFor(element);
    setErrors((previous) => ({ ...previous, [element.name]: message }));
  };

  const clear = () => {
    setErrors({});
  };

  return { check, clear, errors, recheck };
};

/** Sends the enquiry; resolves to an error message, or null once it is in. */
const send = async (
  data: FormData,
  turnstileToken: string
): Promise<string | null> => {
  const services = data
    .getAll("services")
    .flatMap((value) =>
      value instanceof File ? [] : (choice(SERVICES, value) ?? [])
    );
  const { error } = await actions.contact({
    budget: choice(BUDGETS, field(data, "budget")),
    company: optional(field(data, "company")),
    email: field(data, "email"),
    message: field(data, "message"),
    name: field(data, "name"),
    referrer: optional(field(data, "referrer")),
    services: services.length === 0 ? undefined : services,
    timeline: choice(TIMELINES, field(data, "timeline")),
    turnstileToken,
    website: optional(field(data, "website")),
  });
  if (error === undefined) {
    return null;
  }
  return isInputError(error)
    ? "Please check your details and try again."
    : error.message;
};

/**
 * The form is taller than the thank-you note that replaces it, so bring the
 * note into view and move focus to it as it mounts.
 */
const reveal = (element: HTMLOutputElement | null) => {
  if (element === null) {
    return;
  }
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
};

/** The message above the buttons, if any. */
const failureMessage = (status: Status, spamCheckFailed: boolean) => {
  if (spamCheckFailed) {
    return "The spam check could not load. Please refresh the page.";
  }
  return status.state === "error" ? status.message : null;
};

const ContactForm = ({ turnstileSiteKey }: ContactFormProps) => {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [current, setCurrent] = useState(0);
  const [back, setBack] = useState(false);
  // Step two is all optional, so its button reads "Skip" until something is picked.
  const [answeredBudget, setAnsweredBudget] = useState(false);
  // The spam check mounts once the last step is first shown: Turnstile cannot
  // size itself inside a hidden container.
  const [reachedEnd, setReachedEnd] = useState(false);
  const referrer = useRef<HTMLInputElement>(null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const moved = useRef(false);
  const spam = useSpamCheck(turnstileSiteKey, reachedEnd);
  const fields = useFieldErrors();

  // Prefill from a referral link (`?ref=`), after hydration so SSR markup matches.
  useEffect(() => {
    const name = currentReferrer(new URL(window.location.href));
    const input = referrer.current;
    if (name !== undefined && input !== null && input.value === "") {
      input.value = name;
    }
  }, []);

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (moved.current) {
      steps.current[current]?.querySelector("h2")?.focus();
    }
  }, [current]);

  const goTo = (index: number) => {
    moved.current = true;
    setBack(index < current);
    setCurrent(index);
    if (index === LAST) {
      setReachedEnd(true);
    }
  };

  const next = () => {
    if (fields.check(steps.current[current] ?? null)) {
      goTo(Math.min(current + 1, LAST));
    }
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Enter in an earlier step advances instead of sending.
    if (current < LAST) {
      next();
      return;
    }
    if (!fields.check(steps.current[current] ?? null)) {
      return;
    }
    const data = new FormData(event.currentTarget);
    setStatus({ state: "sending" });
    const turnstileToken = await spam.awaitToken();
    const message =
      turnstileToken === ""
        ? "The spam check is taking longer than usual. Please try again in a moment."
        : await send(data, turnstileToken);
    setStatus(
      message === null
        ? {
            email: field(data, "email"),
            name: field(data, "name"),
            state: "sent",
          }
        : { message, state: "error" }
    );
  };

  if (status.state === "sent") {
    return <Sent name={status.name} email={status.email} sentRef={reveal} />;
  }

  const sending = status.state === "sending";
  const failure = failureMessage(status, spam.failed);
  const stepRef = (index: number) => (element: HTMLElement | null) => {
    steps.current[index] = element;
  };
  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      onInput={(event) => {
        fields.recheck(event.target);
      }}
      onChange={(event) => {
        const name = validatedTarget(event.target)?.name;
        if (name === "budget" || name === "timeline") {
          setAnsweredBudget(true);
        }
      }}
      noValidate
      className="flex flex-col gap-10"
    >
      <Progress current={current} />

      <Step index={0} current={current} back={back} stepRef={stepRef(0)}>
        <ProjectFields errors={fields.errors} />
      </Step>

      <Step index={1} current={current} back={back} stepRef={stepRef(1)}>
        <BudgetFields />
      </Step>

      <Step index={2} current={current} back={back} stepRef={stepRef(2)}>
        <AboutFields
          errors={fields.errors}
          referrerRef={referrer}
          widgetRef={spam.widget}
        />
      </Step>

      <div className="flex flex-col gap-4">
        {failure !== null && (
          <div className="animate-in fade-in duration-200 ease-out">
            <FieldError>{failure}</FieldError>
          </div>
        )}
        <div className="flex gap-3">
          {current > 0 && (
            <Button
              type="button"
              variant="outline"
              size="hero"
              onClick={() => {
                fields.clear();
                goTo(current - 1);
              }}
              disabled={sending}
            >
              <ArrowLeftIcon aria-hidden="true" />
              Back
            </Button>
          )}
          {current < LAST ? (
            <Button
              key="next"
              type="button"
              size="hero"
              className="flex-1"
              onClick={next}
            >
              {current === 1 && !answeredBudget ? "Skip" : "Next"}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          ) : (
            <Button
              key="send"
              type="submit"
              size="hero"
              className="flex-1"
              disabled={sending}
            >
              {sending && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {sending ? "Sending" : "Send enquiry"}
              {!sending && <ArrowRightIcon aria-hidden="true" />}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ContactForm;
