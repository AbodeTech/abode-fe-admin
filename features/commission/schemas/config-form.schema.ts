import { z } from 'zod';

import type { CommissionConfig } from './commission.schema';

/* ============================================================
 * Commission config edit form.
 *
 * The form shape **mirrors the API shape** rather than flattening it. A flat
 * form would need a hand-written flat↔nested map, and that map is exactly
 * where an `associate_pro` / `associate-pro` slip would hide — silently
 * resolving to `default` with no error.
 *
 * Rates are entered as percentages (12.5 = 12.5%) and stored as fractions.
 * That conversion happens here, in one place, and nowhere else.
 * ============================================================ */

const percentField = z
  .number({ message: 'Enter a percentage' })
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100%');

const amountField = z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative');

/** Tiers each rate table ships with. Absent tiers fall back to `default` on the BE. */
export const DIRECT_TIERS = ['founder', 'associate-pro', 'premium', 'default'] as const;
export const UPLINE_TIERS = ['founder', 'associate-pro', 'premium'] as const;
export const TOPLINE_TIERS = ['founder', 'associate-pro'] as const;

const directTiers = z.object({
  founder: percentField,
  'associate-pro': percentField,
  premium: percentField,
  default: percentField,
});

const uplineTiers = z.object({
  founder: percentField,
  'associate-pro': percentField,
  premium: percentField,
});

const toplineTiers = z.object({
  founder: percentField,
  'associate-pro': percentField,
});

export const configFormSchema = z.object({
  flexCommission: z.object({ direct: directTiers }),
  fullOwnershipCommission: z.object({
    direct: directTiers,
    upline: uplineTiers,
    topline: toplineTiers,
  }),
  wht_rate: percentField,
  marketplace_platform_fee_pct: percentField,
  upgrade_commission_pct: percentField,
  associate_pro_fee: amountField,
  high_commission_alert_threshold: amountField,
  /**
   * Required since 2026-07-28 — the BE records it on the version
   * (`@IsNotEmpty`), and the history screen displays it. The BE only demands
   * non-empty; no stricter rule is invented here.
   */
  reason: z.string().trim().min(1, 'Say why this change is being published'),
});

export type ConfigFormValues = z.infer<typeof configFormSchema>;

/**
 * Fraction → percentage for display.
 *
 * `toFixed(4)` before `Number()` is not cosmetic: `0.07 * 100` is
 * `7.000000000000001` in JavaScript, which would render in the input and then
 * be published back as a subtly different rate.
 */
const toPercentInput = (fraction: number | undefined): number =>
  Number(((fraction ?? 0) * 100).toFixed(4));

const toFraction = (percent: number): number => percent / 100;

/**
 * Seed the form from the active config.
 *
 * Typed from the schema-derived `CommissionConfig`, never a hand-written
 * shape — a mapper reading a stale shape is the one bug class neither tsc nor
 * Zod catches.
 */
export function configToForm(config: CommissionConfig): ConfigFormValues {
  const flex = config.flexCommission.direct;
  const fo = config.fullOwnershipCommission;

  return {
    flexCommission: {
      direct: {
        founder: toPercentInput(flex.founder),
        'associate-pro': toPercentInput(flex['associate-pro']),
        premium: toPercentInput(flex.premium),
        default: toPercentInput(flex.default),
      },
    },
    fullOwnershipCommission: {
      direct: {
        founder: toPercentInput(fo.direct.founder),
        'associate-pro': toPercentInput(fo.direct['associate-pro']),
        premium: toPercentInput(fo.direct.premium),
        default: toPercentInput(fo.direct.default),
      },
      upline: {
        founder: toPercentInput(fo.upline.founder),
        'associate-pro': toPercentInput(fo.upline['associate-pro']),
        premium: toPercentInput(fo.upline.premium),
      },
      topline: {
        founder: toPercentInput(fo.topline.founder),
        'associate-pro': toPercentInput(fo.topline['associate-pro']),
      },
    },
    wht_rate: toPercentInput(config.wht_rate),
    marketplace_platform_fee_pct: toPercentInput(config.marketplace_platform_fee_pct),
    upgrade_commission_pct: toPercentInput(config.upgrade_commission_pct),
    associate_pro_fee: config.associate_pro_fee,
    high_commission_alert_threshold: config.high_commission_alert_threshold,
    // Always seeded empty — a new version needs its own justification, not
    // the previous one's.
    reason: '',
  };
}

/**
 * Exactly the fields `CreateCommissionConfigDto` declares — no more.
 *
 * The BE runs `forbidNonWhitelisted`, so including `version`, `_id`,
 * `last_modified_by` or timestamps would be a hard 400. Version is assigned
 * server-side.
 */
export type PublishConfigPayload = {
  flexCommission: { direct: Record<string, number> };
  fullOwnershipCommission: {
    direct: Record<string, number>;
    upline: Record<string, number>;
    topline: Record<string, number>;
  };
  wht_rate: number;
  marketplace_platform_fee_pct: number;
  upgrade_commission_pct: number;
  associate_pro_fee: number;
  high_commission_alert_threshold: number;
  reason: string;
};

export function formToPayload(values: ConfigFormValues): PublishConfigPayload {
  const rates = (table: Record<string, number>): Record<string, number> =>
    Object.fromEntries(Object.entries(table).map(([tier, percent]) => [tier, toFraction(percent)]));

  return {
    flexCommission: { direct: rates(values.flexCommission.direct) },
    fullOwnershipCommission: {
      direct: rates(values.fullOwnershipCommission.direct),
      upline: rates(values.fullOwnershipCommission.upline),
      topline: rates(values.fullOwnershipCommission.topline),
    },
    wht_rate: toFraction(values.wht_rate),
    marketplace_platform_fee_pct: toFraction(values.marketplace_platform_fee_pct),
    upgrade_commission_pct: toFraction(values.upgrade_commission_pct),
    // Money passes through untouched — decimal naira, no ×100 anywhere.
    associate_pro_fee: values.associate_pro_fee,
    high_commission_alert_threshold: values.high_commission_alert_threshold,
    reason: values.reason.trim(),
  };
}
