import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,

  // Catch references to names that do not exist.
  //
  // eslint-config-next leaves this off, and `next build` does not scope-check
  // plain JS either — so a component could reference an undefined variable and
  // pass both, failing only when the page rendered in a browser. That is exactly
  // how `actions is not defined` reached the workflow builder: build clean, lint
  // clean, broken on load.
  //
  // The shared config already declares 1100+ browser and node globals, so this
  // costs nothing and closes the gap.
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    rules: { "no-undef": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
