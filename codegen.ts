
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://e0swwow440owgo0c4s8gs04g.abodeflex.com.ng/graphql",
  documents: ["lib/**/*.{ts,tsx}", "actions/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  generates: {
    "lib/gql/": {
      preset: "client",
      plugins: []
    }
  },
  ignoreNoDocuments: true,
};

export default config;
