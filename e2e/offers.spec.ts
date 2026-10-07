import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE, ASSET_EMPTY } from './fixtures';

/**
 * Offers tab: add offer, add size, add plan, the offer configuration
 * activity log picking up every one of those writes, and the real, asset-wide
 * Selling Charges module that replaced the old per-plan "plan price
 * versioning"/"price-step schedule" design (both retired — land_price is a
 * plain-editable field on the plan dialog again, its pre-Sprint-3 behaviour).
 *
 * Every field fill is scoped to `page.getByRole('dialog')` with
 * `{ exact: true }` — a short field label like "Size" is a case-insensitive
 * substring of its own dialog's title ("Add size"), and `getByLabel`
 * without `exact` matches the dialog container too (its accessible name
 * comes from `aria-labelledby` pointing at that title), a strict-mode
 * violation caught by an actual run, not predicted upfront.
 */
test.describe.serial('Offers', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('shows the existing offer tree for an asset with one', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'offers'));
    await expect(page.getByText('Full ownership').first()).toBeVisible();
  });

  test('adds a missing offer type to an asset that doesn\'t sell it yet', async () => {
    await page.goto(assetTabUrl(ASSET_EMPTY, 'offers'));
    // "Add offer" lives in the Offer land pools header now, as a menu of the offer types this asset lacks.
    await page.getByRole('button', { name: 'Add offer' }).click();
    await page.getByRole('menuitem', { name: 'Commercial' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Commercial uses the FO model — payment_type is required, unlike flex.
    await dialog.getByRole('combobox', { name: 'Payment type' }).click();
    await page.getByRole('option', { name: 'All inclusive' }).click();
    await dialog.getByLabel('First size', { exact: true }).fill('250');
    await dialog.getByLabel('Configured units', { exact: true }).fill('4');
    await dialog.getByRole('button', { name: 'Add offer' }).click();

    await expect(page.getByText(/added/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();
    await expect(page.getByText('250').first()).toBeVisible();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
  });

  test('adds a size to the newly added offer', async () => {
    // "Add size" appears on the offer card whose type now exists.
    await page.getByRole('button', { name: 'Add size' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Size', { exact: true }).fill('400');
    await dialog.getByLabel('Configured units', { exact: true }).fill('6');
    await dialog.getByRole('button', { name: 'Add size' }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText('400').first()).toBeVisible();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
  });

  test('adds a plan to a size', async () => {
    // The flex offer's seeded sizes already carry 12/24/36-month plans (see
    // instalmentPlan() in lib/mocks/routes/assets.ts) — tenor 6 is guaranteed
    // not to collide with an existing plan on whichever size "Add plan" opens.
    await page.getByRole('button', { name: 'Add plan' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Tenor', { exact: true }).fill('6');
    await dialog.getByLabel('Land price', { exact: true }).fill('5000000');
    await dialog.getByLabel('Initial payment', { exact: true }).fill('1000000');
    await dialog.getByLabel('Monthly instalment', { exact: true }).fill('800000');
    await dialog.getByRole('button', { name: 'Add plan' }).click();

    await expect(page.getByText('Plan added')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
  });

  test('offer configuration history records every write made on this asset so far', async () => {
    // Still on Harmony Gardens (ASSET_EMPTY) — history is per-asset, so this
    // must run before the next test switches to Aviation City, not after.
    await page.getByRole('button', { name: 'History' }).first().click();
    await expect(page.getByRole('heading', { name: 'Offer configuration history' })).toBeVisible();
    await expect(page.getByText(/Added the commercial offer/i)).toBeVisible();
    await expect(page.getByText(/Added a .*sqm size/i)).toBeVisible();
    await expect(page.getByText(/Added a .*plan/i)).toBeVisible();
    await closeDialog(page);
  });

  test('a plan\'s land price is plain-editable, once the kind of price edit is stated', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'offers'));

    // A full-ownership plan: Flex sizes are priced by a base plan now (or hide their hand-entered
    // plans behind a row expander), so the always-visible plans table is the full-ownership one.
    const fo = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Full ownership', exact: true }) });
    const planRow = fo.locator('tr', { hasText: '24 months' }).first();
    await planRow.getByRole('button', { name: 'Plan actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Edit plan' })).toBeVisible();
    const priceField = dialog.getByLabel('Land price', { exact: true });
    await expect(priceField).toBeEnabled();

    // A price different from whatever an earlier run left, so the edit is always a real change.
    const newPrice = 2_000_000 + (Date.now() % 90) * 1000;
    // 24 months = initial + 23 instalments, and planFormSchema refuses numbers that don't add up,
    // so split the price exactly: a whole-naira instalment, with the remainder in the initial payment.
    const monthly = Math.floor((newPrice - 600_000) / 23);
    const initial = newPrice - 23 * monthly;
    await priceField.fill(String(newPrice));
    await dialog.getByLabel('Initial payment', { exact: true }).fill(String(initial));
    await dialog.getByLabel('Monthly instalment', { exact: true }).fill(String(monthly));

    // Changing a plan's money now has to say what kind of edit it is, and why.
    await expect(dialog.getByText('What kind of price edit is this?')).toBeVisible();
    await dialog.getByRole('radio', { name: /Correction/ }).click();
    await dialog.getByLabel('Reason', { exact: true }).fill('E2E: price corrected');
    await dialog.getByRole('button', { name: 'Save plan' }).click();

    await expect(page.getByText('Plan saved')).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();
    // Desktop table + mobile card both render simultaneously (toggled by CSS,
    // not conditional mounting), so the new price appears twice in the DOM.
    await expect(fo.getByText(newPrice.toLocaleString('en-US')).first()).toBeVisible();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
  });

  // Stale since before the Flex 2.0 work: the "Price versions" button this drives no longer exists on the Offers
  // tab, and SellingChargesPanel/-Dialog/-HistorySheet aren't mounted on any page, so the flow is unreachable.
  // Re-enable (and re-check its selectors) when the selling-charges UI is put back on a page.
  test.fixme('selling charges: sets up the estate\'s first version, then sees it in history', async () => {
    // Selling charges live in the "Price versions" side sheet, not on the page.
    await page.getByRole('button', { name: 'Price versions' }).click();
    const sheet = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Price versions' }) });
    await expect(sheet.getByRole('heading', { name: 'Selling charges' })).toBeVisible();
    await expect(sheet.getByText('No selling charges approved yet')).toBeVisible();

    await sheet.getByRole('button', { name: 'Set up charges' }).click();
    const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Edit selling charges' }) });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Add charge' }).click();
    await dialog.getByLabel('Label', { exact: true }).fill('Estate development levy');
    await dialog.getByLabel('Amount', { exact: true }).fill('250000');
    await dialog.getByLabel('Effective date', { exact: true }).fill('2026-01-01');
    await dialog.getByLabel('Reason for this change', { exact: true }).fill('E2E selling charges setup');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Selling charges saved')).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);

    await expect(sheet.getByText('Estate development levy', { exact: true })).toBeVisible();
    await expect(sheet.getByText('Version 1', { exact: false })).toBeVisible();

    await sheet.getByRole('button', { name: 'History' }).click();
    await expect(page.getByRole('heading', { name: 'Selling charges history' })).toBeVisible();
    await expect(page.getByText('E2E selling charges setup')).toBeVisible();
    await closeDialog(page);
    await closeDialog(page);

    // The plan rows now carry the version just approved.
    await expect(page.getByText(/^v1 · /).first()).toBeVisible();
  });

  test('offer configuration history stays scoped to Aviation City, not Harmony Gardens\' earlier writes', async () => {
    await page.getByRole('button', { name: 'History' }).first().click();
    await expect(page.getByRole('heading', { name: 'Offer configuration history' })).toBeVisible();
    await expect(page.getByText(/Added the commercial offer/i)).toHaveCount(0);
    await closeDialog(page);
  });
});
