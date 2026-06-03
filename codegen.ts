import type { CodegenConfig } from '@graphql-codegen/cli';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.NEXT_PUBLIC_API_BASE_URL,
  documents: [
    "lib/**/*.{ts,tsx}",
    "actions/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}",
    // TEMP exclusions — FE queries ahead of / drifted from BE staging schema.
    // Remove each once the BE schema catches up (or the FE hook is updated).
    "!features/assets/hooks/use-plots.ts",
    "!features/allocation/hooks/use-allocate-land.ts",
    "!features/associates/hooks/use-top-associates.ts",
  ],
  generates: {
    "lib/gql/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
