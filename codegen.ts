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
    "!features/associate-managers/hooks/use-manager-rating-series.ts",
    // Allocation events: these query the attendance split (attendee_type,
    // getting_land, status), the event slug/public_url/open_registration and
    // the attending/registrants funnel counts. All live on the BE's
    // feature/allocation-events branch and are not on the schema this
    // introspects yet. Each parses its document manually in the meantime —
    // see the note in use-event-registrations.ts. Remove these five and
    // re-run codegen once that branch is on staging.
    "!features/company-events/hooks/use-company-event.ts",
    "!features/company-events/hooks/use-company-events.ts",
    "!features/company-events/hooks/use-create-company-event.ts",
    "!features/company-events/hooks/use-event-allocations.ts",
    "!features/company-events/hooks/use-event-analytics.ts",
    "!features/company-events/hooks/use-event-registrations.ts",
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
