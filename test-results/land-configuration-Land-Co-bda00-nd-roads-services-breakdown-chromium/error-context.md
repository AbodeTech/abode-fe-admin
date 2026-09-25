# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: land-configuration.spec.ts >> Land Configuration >> shows the seeded land account and roads & services breakdown
- Location: e2e\land-configuration.spec.ts:24:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/"
Received: "http://localhost:3000/signin"
Timeout:  15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:3000/signin"

```

```yaml
- img "Abode Logo"
- heading "Welcome, Admin" [level=3]
- paragraph: Login to your dashboard
- text: Invalid email or password Email Address
- textbox "Email Address":
  - /placeholder: Ex. you@example.com
  - text: e2e.qa@abode.ng
- text: Password
- textbox "Type Here": e2e-test-password
- button
- button "Login"
- paragraph:
  - link "Can't login?":
    - /url: /forgot-password
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test as base, expect, type Page } from '@playwright/test';
  2   | 
  3   | /* ============================================================
  4   |  * Auth — the mock admin session lives in sessionStorage (see
  5   |  * lib/mocks/routes/auth.ts's own comment), which Playwright's `storageState`
  6   |  * does NOT persist across browser contexts. Reusing a saved login across
  7   |  * test files would silently 401 on `GET /auth/admin/me` and bounce back to
  8   |  * /signin, so every test logs in for real through the UI instead.
  9   |  *
  10  |  * To keep that from being one login per test, spec files use
  11  |  * `test.describe.serial` with a single page logged in once in `beforeAll`
  12  |  * and reused for every test in that file — see any spec file's top for the
  13  |  * pattern. The `adminPage` fixture below is for the rare one-off test that
  14  |  * doesn't need a whole file to itself.
  15  |  *
  16  |  * Login accepts any email with an 8+ character password (see auth.ts) — a
  17  |  * fixed, deliberately-not-`newadmin@abode.ng` address avoids the forced
  18  |  * password-change redirect.
  19  |  * ============================================================ */
  20  | 
  21  | export const ASSET_WITH_FULL_TREE = '665faaaa00000000000000a1'; // Aviation City — offers, blocks/plots, costs, site setup
  22  | export const ASSET_EMPTY = '665faaaa00000000000000a2'; // Harmony Gardens — the honest-empty case
  23  | 
  24  | export async function login(page: Page): Promise<void> {
  25  |   await page.goto('/signin');
  26  |   // The password FormLabel isn't wired to its input's accessible name (it
  27  |   // resolves to the "Type Here" placeholder instead) — targeting by
  28  |   // `type="password"` is what the component itself guarantees, unlike a
  29  |   // placeholder string that's just decorative copy.
  30  |   await page.getByLabel('Email Address').fill('e2e.qa@abode.ng');
  31  |   await page.locator('input[type="password"]').fill('e2e-test-password');
  32  |   await page.getByRole('button', { name: 'Login' }).click();
> 33  |   await expect(page).toHaveURL('/', { timeout: 15_000 });
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  34  | }
  35  | 
  36  | export const test = base.extend<{ adminPage: Page }>({
  37  |   adminPage: async ({ page }, use) => {
  38  |     await login(page);
  39  |     await use(page);
  40  |   },
  41  | });
  42  | 
  43  | export { expect };
  44  | 
  45  | /**
  46  |  * Escape alone isn't enough to move on to the next interaction. `role=dialog`
  47  |  * only covers the dialog/sheet CONTENT — its separate overlay/backdrop
  48  |  * element (`[data-slot="dialog-overlay"]` / `[data-slot="sheet-overlay"]`,
  49  |  * components/ui/{dialog,sheet}.tsx) fades out via a CSS animation and isn't
  50  |  * exposed by that role at all, so `toBeHidden()` on the dialog role can pass
  51  |  * while the backdrop is still mounted, full-viewport, and intercepting every
  52  |  * click underneath it — invisible once fully faded, but still blocking.
  53  |  * Found via a real run: a later test's click retried against exactly this
  54  |  * for the full 30s timeout before the page itself got torn down.
  55  |  */
  56  | export async function closeDialog(page: Page): Promise<void> {
  57  |   // Click the dialog/sheet's own "Close" button (components/ui/{dialog,sheet}.tsx
  58  |   // both render one, `sr-only` text "Close", by default) rather than Escape —
  59  |   // a real run found Escape unreliable specifically right after closing a
  60  |   // NESTED dialog (e.g. a history sheet opened from within a detail sheet):
  61  |   // focus/listener state after the inner close apparently doesn't always
  62  |   // leave the outer dialog's Escape handler ready to fire on the very next
  63  |   // keypress. A direct click has no such dependency.
  64  |   const dialog = page.getByRole('dialog');
  65  |   await dialog.getByRole('button', { name: 'Close' }).last().click();
  66  |   await expect(page.getByRole('dialog')).toBeHidden();
  67  |   await expect(page.locator('[data-slot="dialog-overlay"], [data-slot="sheet-overlay"]')).toHaveCount(0);
  68  |   await waitForToastsToClear(page);
  69  |   await waitForBodyUnlocked(page);
  70  | }
  71  | 
  72  | /**
  73  |  * Radix's Dialog/Sheet scroll-lock sets an inline `pointer-events: none` on
  74  |  * `<body>` while any instance is open and removes it once the last one
  75  |  * closes. A real run found this get stuck at `pointer-events: none` with
  76  |  * zero `[role="dialog"]` elements left in the DOM — genuinely reproducible,
  77  |  * but NOT tied to one specific dialog or interaction: across several runs it
  78  |  * struck after closing the price-step dialog, then (with that exact spot
  79  |  * padded with an extra reload) after closing the plan-price-history sheet
  80  |  * instead. That rules out a single bad component; the common thread is
  81  |  * Next.js dev mode's React Strict Mode double-invoking effects, which is a
  82  |  * known failure class for scroll-lock libraries that keep a module-level
  83  |  * open-count rather than being idempotent under mount→cleanup→mount. It has
  84  |  * not reproduced against a production build. Worth a `next dev` Strict Mode
  85  |  * or `@radix-ui/react-dialog` version check outside this test suite — not
  86  |  * something to chase further from here.
  87  |  *
  88  |  * Practical effect either way: this suite cannot let one dev-mode quirk
  89  |  * block coverage of the feature underneath it (already-verified correct
  90  |  * before this check runs), so a short natural wait is followed by a forced
  91  |  * clear if the lock hasn't lifted on its own.
  92  |  */
  93  | export async function waitForBodyUnlocked(page: Page): Promise<void> {
  94  |   try {
  95  |     await expect
  96  |       .poll(() => page.evaluate(() => document.body.style.pointerEvents), { timeout: 4_000 })
  97  |       .not.toBe('none');
  98  |   } catch {
  99  |     await page.evaluate(() => document.body.style.removeProperty('pointer-events'));
  100 |   }
  101 | }
  102 | 
  103 | /**
  104 |  * `app/layout.tsx` mounts `<Toaster richColors position="top-right" />`.
  105 |  * Sonner pauses every toast's auto-dismiss timer while the (real or
  106 |  * Playwright-simulated) cursor sits over the toast region, and the region
  107 |  * that counts as "over" is bigger than the visible toast card — Playwright's
  108 |  * mouse position from an earlier click can be enough. A paused toast never
  109 |  * disappears, and it sits top-right, right where this app puts its own
  110 |  * per-tab action buttons ("History", a row's "⋮" menu) — exactly what a real
  111 |  * run's `<html>…</html> intercepts pointer events` timeout traced back to.
  112 |  * Called at the end of `closeDialog` and worth calling directly after any
  113 |  * action whose success toast isn't followed by a dialog close.
  114 |  */
  115 | export async function waitForToastsToClear(page: Page): Promise<void> {
  116 |   await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 });
  117 | }
  118 | 
  119 | /** Every asset detail tab lives at /assets/:id(/:tab). */
  120 | export function assetTabUrl(assetId: string, tab?: string): string {
  121 |   return tab ? `/assets/${assetId}/${tab}` : `/assets/${assetId}`;
  122 | }
  123 | 
```