/**
 * Transport-level mock API.
 * Set NEXT_PUBLIC_USE_MOCKS=true to serve fixtures from lib/mocks instead of the network.
 */
export function isMockApiEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_MOCKS?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}
