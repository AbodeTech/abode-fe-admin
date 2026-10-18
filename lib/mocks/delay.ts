export function mockDelay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
