export * from './schemas/agency.schema';

export * from './hooks/query-keys';
export * from './hooks/use-agencies';
export * from './hooks/use-agency';
export * from './hooks/use-agency-members';
export * from './hooks/use-agency-commissions';
export * from './hooks/use-agency-stats';
export * from './hooks/use-create-agency';
export * from './hooks/use-agency-actions';
export * from './hooks/use-set-user-org';
export * from './hooks/use-export-agency-commissions';

export * from './components/AgencyListFilters';
export * from './components/AgencyListTable';
export * from './components/AgencySystemMetrics';
export * from './components/AgencyDetailView';
export * from './components/AgencyMembersTable';
export * from './components/AgencyCommissionsTable';
export * from './components/AgencyOnboardingForm';
export * from './components/AgencyEditDialog';
export * from './components/AgencySuspendDialog';
export * from './components/AgencyDeleteDialog';
export * from './components/AgencyChangeOwnerDialog';

/* ------------------------------------------------------------
 * Removed with the REST port, not pending: the v1 GraphQL agency dashboard
 * and wallet screens (`useAgencyDashboard`, `useAgencyTransactions`,
 * AgencyDashboardPanels, TopPerformingAgenciesTable, the AgencyTransaction*
 * tables, AgencyWalletTransactionsTable, AgencyUsersTable).
 *
 * abode-be-v2 exposes no agency aggregate — no sales volume, no clients
 * recruited, no wallet ledger — so there was nothing to port them onto, and
 * they were already dead: the app points at REST and their `executeRaw`
 * calls could not resolve. `/agency`, `/agency/top-performing` and
 * `/agency/transactions` now redirect into the list and detail screens.
 *
 * Reinstating any of them needs new BE aggregates first.
 * See docs/REST-ENDPOINT-MAP.md.
 * ------------------------------------------------------------ */
