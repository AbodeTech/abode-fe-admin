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
  allowPartialOutputs: true,
};

export default config;
