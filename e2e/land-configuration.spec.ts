import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Land Configuration (the Overview tab's "Land account" card + editor +
 * history) — wired to the real abode-be-v2 endpoint this session. Exercises
 * the real request shape (`products`, not the old, wrong `product_pools`
 * key) and the history list/detail split (the list is summary rows only;
 * a row's diff is fetched on demand when expanded).
 */
test.describe.serial('Land Configuration', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE));
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('shows the seeded land account', async () => {
    await expect(page.getByRole('heading', { name: 'Land account' })).toBeVisible();
    await expect(page.getByText('350,000 sqm').first()).toBeVisible();
    // The named roads & services rows live in the editor drawer now, not on the Overview itself.
    await expect(page.getByText('Roads & services').first()).toBeVisible();
  });

  test('edits a product pool and saves — proves the real `products` request key round-trips', async () => {
    await page.getByRole('button', { name: 'Edit breakdown' }).first().click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Land account' })).toBeVisible();

    await expect(sheet.getByText('Internal roads').first()).toBeVisible();
    await sheet.getByLabel('Commercial — assigned sqm', { exact: true }).fill('50000');

    await sheet.getByLabel('Reason for this change', { exact: true }).fill('E2E test edit');
    await sheet.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Land account saved')).toBeVisible({ timeout: 10_000 });
    await expect(sheet).toBeHidden();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);

    // 126,000 (flex) + 95,000 (full-ownership) + 50,000 (commercial, just raised) = 271,000
    await expect(page.getByText('271,000 sqm').first()).toBeVisible();
  });

  test('history shows every version and expands a row to fetch its diff on demand', async () => {
    await page.getByRole('button', { name: 'View history' }).click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Land account history' })).toBeVisible();
    await expect(sheet.getByText('v3')).toBeVisible();
    await expect(sheet.getByText('v2')).toBeVisible();
    await expect(sheet.getByText('v1')).toBeVisible();
    await expect(sheet.getByText('E2E test edit')).toBeVisible();

    // Expanding v3 triggers a fresh GET .../history/3 (the list itself only ever
    // carried a summary) and renders the diff once that resolves.
    await sheet.getByText('v3').click();
    await expect(sheet.getByText('Commercial assigned sqm')).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByText('50k SQM')).toBeVisible();

    await closeDialog(page);
  });
});
