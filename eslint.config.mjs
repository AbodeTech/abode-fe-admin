import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright test files, not React code — their fixture `use` callback
    // parameter (e.g. `adminPage`'s `use` in e2e/fixtures.ts) isn't a React
    // hook, but its name coincidentally trips react-hooks/rules-of-hooks.
    "e2e/**",
  ]),
]);

export default eslintConfig;
