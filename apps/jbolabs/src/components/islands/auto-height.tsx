import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Animates its own height to follow its content, so a container whose
 * content changes (a new form step, an error, a thank-you note) glides to
 * the new size instead of jumping. The measured height goes straight to a
 * custom property (no re-render); `auto-height` in global.css transitions it.
 * Until the first measurement the height is simply `auto`.
 */
const AutoHeight = ({ children }: { readonly children: ReactNode }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const size = entry?.borderBoxSize[0]?.blockSize;
      if (size !== undefined) {
        outer.current?.style.setProperty("--auto-height", `${size}px`);
      }
    });
    if (inner.current !== null) {
      observer.observe(inner.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={outer} className="auto-height">
      <div ref={inner}>{children}</div>
    </div>
  );
};

export { AutoHeight };
