import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Costs & Profitability tab, rewired this session to the real abode-be-v2
 * 3-layer model (cost item -> obligation -> stage event, PR #82) — replaces
 * the old flat "one record, five stage snapshots" model and the deleted
 * estate-wide "profitability basis" singleton (allocation is per shared
 * cost item now).
 */
test.describe.serial('Costs & Profitability', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'costs'));
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('shows the cost table and estate profitability card', async () => {
    await expect(page.getByRole('heading', { name: 'Asset costs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Estate profitability' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cost coverage' })).toBeVisible();
    await expect(page.getByText('Perimeter fencing', { exact: true }).first()).toBeVisible();
  });

  test('adds a cost item to the catalogue', async () => {
    await page.getByRole('button', { name: 'Add cost item' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add a cost item' })).toBeVisible();
    await dialog.getByLabel('Name', { exact: true }).fill('E2E test item');
    await dialog.getByRole('button', { name: 'Add item' }).click();

    await expect(page.getByText('Cost item added')).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();
    await waitForToastsToClear(page);
    await expect(page.getByText('E2E test item', { exact: true }).first()).toBeVisible();
  });

  test('adds a cost record against that item', async () => {
    const itemRow = page
      .getByText('E2E test item', { exact: true })
      .first()
      .locator('xpath=ancestor::div[contains(@class,"py-3")][1]');
    await itemRow.getByRole('button', { name: 'Add cost' }).click();

    const drawer = page.getByRole('dialog');
    await expect(drawer.getByRole('heading', { name: 'Add cost' })).toBeVisible();
    // The item is pre-selected from the shortcut — just fill in the rest.
    await drawer.getByLabel('Title', { exact: true }).fill('E2E test cost record');
    await drawer.getByRole('button', { name: 'Add cost' }).click();

    await expect(page.getByText('Cost record added')).toBeVisible({ timeout: 10_000 });
    await expect(drawer).toBeHidden();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
    await expect(page.getByText('E2E test cost record', { exact: true })).toBeVisible();
  });

  test('records a stage, approves it, then reverses it', async () => {
    await page.getByText('E2E test cost record', { exact: true }).click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'E2E test cost record' })).toBeVisible({ timeout: 10_000 });
    await sheet.getByRole('button', { name: 'Add stage' }).click();
    await page.getByRole('menuitem', { name: 'Incurred' }).click();

    const recordDialog = page.getByRole('dialog').last();
    await expect(recordDialog.getByRole('heading', { name: 'Record incurred' })).toBeVisible();
    await recordDialog.getByLabel('Amount', { exact: true }).fill('1000000');
    await recordDialog.getByLabel('Effective date', { exact: true }).fill('2026-01-01');
    await recordDialog.getByRole('button', { name: 'Record' }).click();

    await expect(page.getByText('Incurred recorded')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);

    await sheet.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Incurred approved')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await expect(sheet.getByText('approved', { exact: true }).first()).toBeVisible();

    await sheet.getByRole('button', { name: 'Reverse' }).click();
    const reverseDialog = page.getByRole('dialog').last();
    await expect(reverseDialog.getByRole('heading', { name: 'Reverse incurred' })).toBeVisible();
    await reverseDialog.getByLabel('Reason', { exact: true }).fill('E2E reversal reason');
    await reverseDialog.getByRole('button', { name: 'Reverse' }).click();

    await expect(page.getByText('Incurred reversed')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await expect(sheet.getByText('reversed', { exact: true }).first()).toBeVisible();

    await closeDialog(page);
  });

  test('cost coverage shows the new item and its recognised total', async () => {
    const coverage = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cost coverage' }) });
    await expect(coverage.getByText('E2E test item', { exact: true })).toBeVisible();
  });

  test('sets an allocation rule on a shared cost item', async () => {
    const fencingRow = page
      .getByText('Perimeter fencing', { exact: true })
      .first()
      .locator('xpath=ancestor::div[contains(@class,"py-3")][1]');
    await fencingRow.getByRole('button', { name: 'Allocation' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Set allocation rule' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Preview impact' }).click();
    // Preview always resolves (even to a no-op summary) — proves the request/response wiring works.
    await expect(dialog.getByRole('button', { name: 'Preview impact' })).toBeEnabled({ timeout: 10_000 });

    await dialog.getByLabel('Reason for this change', { exact: true }).fill('E2E allocation rule change');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Allocation rule saved')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
  });

  test('product profitability comparison expands to show its size breakdown', async () => {
    const comparison = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Product profitability comparison' }) });
    await expect(comparison).toBeVisible();

    const firstRow = comparison.locator('button').first();
    await firstRow.click();
    await expect(comparison.getByText(/sqm ·/i).first()).toBeVisible();
  });

  test('the calculation drawer shows the real drill-down breakdown', async () => {
    await page.getByRole('button', { name: 'View calculation' }).first().click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Profitability calculation' })).toBeVisible();
    await expect(sheet.getByText('E2E test item', { exact: true })).toBeVisible();
    await expect(sheet.getByText('Net profit', { exact: true })).toBeVisible();

    await closeDialog(page);
  });
});
