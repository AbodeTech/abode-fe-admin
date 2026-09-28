/**
 * Nigeria's 36 states and the FCT, mirroring
 * `abode-be-v2/src/common/enums/nigerian-state.enum.ts`.
 *
 * The estate's state is a real field on the asset because two code paths were
 * separately guessing it out of the free-text location and disagreeing — the
 * buyer's portfolio map read "Ibeju-Lekki, Lagos" as Lagos while the Deed of
 * Assignment printed a blank where the Governor's state belongs. Setting it
 * here is what stops either from guessing.
 */
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** "FCT" reads oddly on its own in a dropdown. */
export const stateLabel = (state: string): string =>
  state === 'FCT' ? 'FCT (Abuja)' : state;
