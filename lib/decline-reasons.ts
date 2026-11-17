/**
 * Preset reasons offered in the transfer-payment decline dropdowns — asset and
 * document transactions, and associate upgrades. One list so they stay in step.
 *
 * Each is sent to the BE as-is, so every entry must stay at or above the
 * 20-character minimum those decline endpoints enforce.
 */
export const DECLINE_REASON_PRESETS = [
  "Price fluctuation on this asset",
  "Account restrictions apply here",
  "System error during verification",
  "Invalid asset details submitted",
  "Wrong payment receipt uploaded",
  "Payment receipt uploaded twice",
] as const;
