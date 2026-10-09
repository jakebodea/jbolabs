// The strict preset lives in packages/config; this repo only adds its own ignores.
import preset from "@jakebodea/config/oxlint";

export default {
  ...preset,
  ignorePatterns: [
    ...(preset.ignorePatterns ?? []),
    // Upstream Mailflare, an unmodified git submodule with its own toolchain.
    "mailflare/**",
  ],
};
