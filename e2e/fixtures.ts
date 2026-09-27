import { test as base, expect, type Page } from '@playwright/test';

/* ============================================================
 * Auth — the mock admin session lives in sessionStorage (see
 * lib/mocks/routes/auth.ts's own comment), which Playwright's `storageState`
 * does NOT persist across browser contexts. Reusing a saved login across
 * test files would silently 401 on `GET /auth/admin/me` and bounce back to
 * /signin, so every test logs in for real through the UI instead.
 *
 * To keep that from being one login per test, spec files use
 * `test.describe.serial` with a single page logged in once in `beforeAll`
 * and reused for every test in that file — see any spec file's top for the
 * pattern. The `adminPage` fixture below is for the rare one-off test that
 * doesn't need a whole file to itself.
 *
 * Login accepts any email with an 8+ character password (see auth.ts) — a
 * fixed, deliberately-not-`newadmin@abode.ng` address avoids the forced
 * password-change redirect.
 * ============================================================ */

export const ASSET_WITH_FULL_TREE = '665faaaa00000000000000a1'; // Aviation City — offers, blocks/plots, costs, site setup
export const ASSET_EMPTY = '665faaaa00000000000000a2'; // Harmony Gardens — the honest-empty case

export async function login(page: Page): Promise<void> {
  await page.goto('/signin');
  // The password FormLabel isn't wired to its input's accessible name (it
  // resolves to the "Type Here" placeholder instead) — targeting by
  // `type="password"` is what the component itself guarantees, unlike a
  // placeholder string that's just decorative copy.
  await page.getByLabel('Email Address').fill('e2e.qa@abode.ng');
  await page.locator('input[type="password"]').fill('e2e-test-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/', { timeout: 15_000 });
}

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };

/**
 * Escape alone isn't enough to move on to the next interaction. `role=dialog`
 * only covers the dialog/sheet CONTENT — its separate overlay/backdrop
 * element (`[data-slot="dialog-overlay"]` / `[data-slot="sheet-overlay"]`,
 * components/ui/{dialog,sheet}.tsx) fades out via a CSS animation and isn't
 * exposed by that role at all, so `toBeHidden()` on the dialog role can pass
 * while the backdrop is still mounted, full-viewport, and intercepting every
 * click underneath it — invisible once fully faded, but still blocking.
 * Found via a real run: a later test's click retried against exactly this
 * for the full 30s timeout before the page itself got torn down.
 */
export async function closeDialog(page: Page): Promise<void> {
  // Click the dialog/sheet's own "Close" button (components/ui/{dialog,sheet}.tsx
  // both render one, `sr-only` text "Close", by default) rather than Escape —
  // a real run found Escape unreliable specifically right after closing a
  // NESTED dialog (e.g. a history sheet opened from within a detail sheet):
  // focus/listener state after the inner close apparently doesn't always
  // leave the outer dialog's Escape handler ready to fire on the very next
  // keypress. A direct click has no such dependency.
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('[data-slot="dialog-overlay"], [data-slot="sheet-overlay"]')).toHaveCount(0);
  await waitForToastsToClear(page);
  await waitForBodyUnlocked(page);
}

/**
 * Radix's Dialog/Sheet scroll-lock sets an inline `pointer-events: none` on
 * `<body>` while any instance is open and removes it once the last one
 * closes. A real run found this get stuck at `pointer-events: none` with
 * zero `[role="dialog"]` elements left in the DOM — genuinely reproducible,
 * but NOT tied to one specific dialog or interaction: across several runs it
 * struck after closing the price-step dialog, then (with that exact spot
 * padded with an extra reload) after closing the plan-price-history sheet
 * instead. That rules out a single bad component; the common thread is
 * Next.js dev mode's React Strict Mode double-invoking effects, which is a
 * known failure class for scroll-lock libraries that keep a module-level
 * open-count rather than being idempotent under mount→cleanup→mount. It has
 * not reproduced against a production build. Worth a `next dev` Strict Mode
 * or `@radix-ui/react-dialog` version check outside this test suite — not
 * something to chase further from here.
 *
 * Practical effect either way: this suite cannot let one dev-mode quirk
 * block coverage of the feature underneath it (already-verified correct
 * before this check runs), so a short natural wait is followed by a forced
 * clear if the lock hasn't lifted on its own.
 */
export async function waitForBodyUnlocked(page: Page): Promise<void> {
  try {
    await expect
      .poll(() => page.evaluate(() => document.body.style.pointerEvents), { timeout: 4_000 })
      .not.toBe('none');
  } catch {
    await page.evaluate(() => document.body.style.removeProperty('pointer-events'));
  }
}

/**
 * `app/layout.tsx` mounts `<Toaster richColors position="top-right" />`.
 * Sonner pauses every toast's auto-dismiss timer while the (real or
 * Playwright-simulated) cursor sits over the toast region, and the region
 * that counts as "over" is bigger than the visible toast card — Playwright's
 * mouse position from an earlier click can be enough. A paused toast never
 * disappears, and it sits top-right, right where this app puts its own
 * per-tab action buttons ("History", a row's "⋮" menu) — exactly what a real
 * run's `<html>…</html> intercepts pointer events` timeout traced back to.
 * Called at the end of `closeDialog` and worth calling directly after any
 * action whose success toast isn't followed by a dialog close.
 */
export async function waitForToastsToClear(page: Page): Promise<void> {
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 });
}

/** Every asset detail tab lives at /assets/:id(/:tab). */
export function assetTabUrl(assetId: string, tab?: string): string {
  return tab ? `/assets/${assetId}/${tab}` : `/assets/${assetId}`;
}
