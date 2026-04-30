import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "bootstrap/**",
      "scripts/**",
      "shell/**",
      "dry_runs/**",
      "agent_runs/**",
      "_forgeshell_archive/**",
      "node_modules/**",
      ".next/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
