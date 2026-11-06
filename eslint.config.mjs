import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Newer advisory rules that flag working older patterns. They stay visible as warnings, and
    // new code shouldn't add to them.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      // Our styled kit gives every control the same look and states. Use it, and customize it there.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name=/^(select|textarea|input|button|label|table|progress|details|kbd)$/]",
          message: "Use the matching component from components/ui, and customize it there.",
        },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      // shadcn/ui and Magic UI. They wrap the native elements, and we customize them by hand.
      "components/ui/**",
      "components/magicui/**",
    ],
  },
];

export default config;
