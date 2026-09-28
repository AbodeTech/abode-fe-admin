import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, assetTabUrl, ASSET_WITH_FULL_TREE, ASSET_EMPTY } from './fixtures';

/**
 * Customers tab (AssetSubscribers) — pre-existing feature, not part of the
 * Sprint 3 Land/Inventory backlog, but never had a mock route for
 * GET /admin/assets/:assetId/subscribers until now (see
 * lib/mocks/routes/asset-subscribers.ts). Covers the list, search, the four
 * SUBSCRIBER_TYPES filter buckets, sorting, the honest-empty state, and the
 * CSV export's deliberate mock-mode refusal.
 *
 * A plain filtered list (no dialogs), so each test re-navigates to a fresh
 * URL rather than resetting filters through the UI — cheaper and avoids any
 * cross-test filter-state coupling.
 */
test.describe.serial('Customers', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('shows every subscriber for an asset with buyers, most recent first', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(6);
    // Default sort is "Date joined — high to low"; Amaka Obi (2026-08-01) is the newest.
    await expect(rows.first()).toContainText('Amaka Obi');
    await expect(page.getByText('John Okafor').first()).toBeVisible();
    await expect(page.getByText('Ibrahim Musa').first()).toBeVisible();
  });

  test('searches by buyer name', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));
    await page.getByPlaceholder('Name, email or phone').fill('Ibrahim');

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Ibrahim Musa');
  });

  test('filters by subscriber type: defaulted', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'Defaulted' }).click();

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Ibrahim Musa');
  });

  test('filters by subscriber type: paid 30%+', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'Paid 30%+' }).click();

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(page.getByText('John Okafor').first()).toBeVisible();
    await expect(page.getByText('Uche Eze').first()).toBeVisible();
    await expect(page.getByText('Tunde Balogun').first()).toBeVisible();
  });

  test('sorts by balance, high to low', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Balance — high to low' }).click();

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toContainText('Ibrahim Musa'); // 26,000,000 balance — the highest
  });

  test('shows an honest empty state for an asset with no subscribers', async () => {
    await page.goto(assetTabUrl(ASSET_EMPTY, 'customers'));
    await expect(page.getByText('No subscribers match these filters.')).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
  });

  test('CSV export refuses in mock mode rather than faking a file', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'customers'));
    await page.getByRole('button', { name: 'Export CSV' }).click();
    await expect(
      page.getByText('Export is unavailable in mock mode — point the app at a real backend.')
    ).toBeVisible({ timeout: 10_000 });
  });
});
