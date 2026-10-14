import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";
export default defineConfig([
  js.configs.recommended,
  ...ts.configs.recommended,
  { files: ["src/**/*.{ts,tsx}"], ...hooks.configs.flat.recommended },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
  globalIgnores([
    ".next/**",
    "public/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
