/* Amaris — the assistant's admin query log, on REST against /admin/amaris/*.
 *
 * Ported from main's "Ilé Assistant" feature and renamed to match the
 * backend module. Read-only by design (AA-18). Gains over the v1 version:
 * the channel dimension (web/WhatsApp filter, stat tiles, column) and the
 * asker's phone — both exist only on the REST module.
 */

export { AmarisQueryStatsStrip } from './components/AmarisQueryStatsStrip';
export { AmarisQueryFilters } from './components/AmarisQueryFilters';
export { AmarisQueryTable } from './components/AmarisQueryTable';

export { useAmarisQueries, useAmarisCounts, DEFAULT_AMARIS_LIMIT } from './hooks/use-amaris-queries';
export type { AmarisListFilters } from './hooks/query-keys';

export {
  AMARIS_AUDIENCES,
  AMARIS_AUDIENCE_LABELS,
  AMARIS_CHANNELS,
  AMARIS_CHANNEL_LABELS,
  askerName,
} from './schemas/amaris.schema';
export type { AmarisAudience, AmarisChannel, AmarisCounts, AmarisQueryRow } from './schemas/amaris.schema';
