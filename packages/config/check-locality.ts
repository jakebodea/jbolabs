/**
 * Prototype (scratch branch only): geo-specific copy belongs on the About page.
 *
 *   bun packages/config/check-locality.ts [root]
 *
 * Evidence: PR #2 added Orange County / Irvine site-wide; PR #8 reverted that
 * outside `apps/jbolabs/src/content/pages.ts` five days later.
 */
const LOCALITY_MARKERS = [
  /\bOrange County\b/u,
  /\bIrvine\b/u,
  /\bSouthern California\b/u,
] as const;

const ABOUT_COPY = "apps/jbolabs/src/content/pages.ts";

export interface LocalityViolation {
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly match: string;
}

export const findLocalityViolations = (
  path: string,
  content: string
): LocalityViolation[] => {
  if (path.replaceAll("\\", "/").endsWith(ABOUT_COPY)) {
    return [];
  }
  const normalized = path.replaceAll("\\", "/");
  if (!normalized.startsWith("apps/jbolabs/src/content/")) {
    return [];
  }
  return content.split("\n").flatMap((text, index) =>
    LOCALITY_MARKERS.flatMap((pattern) =>
      [...text.matchAll(new RegExp(pattern.source, "gu"))].map((match) => ({
        column: (match.index ?? 0) + 1,
        line: index + 1,
        match: match[0],
        path,
      }))
    )
  );
};

export const checkLocality = async (
  root: string
): Promise<LocalityViolation[]> => {
  const pattern = "apps/jbolabs/src/content/**/*.ts";
  const paths = [...new Bun.Glob(pattern).scanSync({ cwd: root })];
  const results = await Promise.all(
    paths.map(async (path) =>
      findLocalityViolations(path, await Bun.file(`${root}/${path}`).text())
    )
  );
  return results.flat();
};

if (import.meta.main) {
  const violations = await checkLocality(process.argv[2] ?? process.cwd());
  for (const { path, line, column, match } of violations) {
    process.stderr.write(
      `${path}:${line}:${column}: move "${match}" to ${ABOUT_COPY} or drop it\n`
    );
  }
  process.exitCode = violations.length > 0 ? 1 : 0;
}
