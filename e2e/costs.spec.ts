import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Costs tab, as the asset-detail design draws it: a summary strip, the cost
 * table (one row per cost item, with budget / committed / incurred / paid),
 * "How shared cost is distributed" and "Recent cost changes". Backed by the
 * real abode-be-v2 3-layer model (cost item -> record -> staged entry).
 * Profit lives on the Performance tab; its calculation drawer is checked there
 * at the end of this file.
 */
test.describe.serial('Costs', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'costs'));
  });

  test.afterAll(async () => {
    await page.close();
  });

  /** The table row for a cost item, found by its name cell. */
  const itemRow = (name: string) => page.locator('tr').filter({ has: page.getByText(name, { exact: true }) }).first();

  test('shows the summary strip, cost table and the two side panels', async () => {
    await expect(page.getByText('Approved budget')).toBeVisible();
    await expect(page.getByText('Forecast remaining')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Asset costs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How shared cost is distributed' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent cost changes' })).toBeVisible();
    await expect(page.getByText('Perimeter fencing', { exact: true }).first()).toBeVisible();
  });

  test('adds a new cost item and its first cost from the one "Add cost" form', async () => {
    await page.getByRole('button', { name: 'Add cost', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add asset cost' })).toBeVisible();

    await dialog.getByRole('combobox', { name: /Cost group/ }).click();
    await page.getByRole('option', { name: 'New cost item…' }).click();
    await dialog.getByLabel(/Cost title/).fill('E2E test cost record');
    await dialog.getByLabel(/New cost item name/).fill('E2E test item');
    await dialog.getByRole('combobox', { name: /Scope/ }).click();
    await page.getByRole('option', { name: 'Shared across products' }).click();
    await dialog.getByRole('combobox', { name: /Allocation basis/ }).click();
    await page.getByRole('option', { name: 'By saleable sqm' }).click();

    // No amount yet: it can only be saved as a draft, which writes the item and the record.
    await dialog.getByRole('button', { name: 'Save draft' }).click();

    await expect(page.getByText(/Saved as a draft/)).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toBeHidden();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);

    // The new row exists, with nothing recorded against it yet.
    await expect(itemRow('E2E test item').getByText('Cost missing')).toBeVisible();
  });

  test('records an invoice from the Revise modal, then reverses it', async () => {
    // One record on the item, so "View" opens it directly.
    await itemRow('E2E test item').getByRole('button', { name: 'View' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'E2E test cost record' })).toBeVisible({ timeout: 10_000 });
    await modal.getByRole('radio', { name: 'Record invoice' }).click();
    await modal.getByLabel(/^Amount/).fill('1000000');
    await modal.getByLabel(/^Effective date/).fill('2026-01-01');
    // The primary button saves the entry and approves it in one go.
    await modal.getByRole('button', { name: 'Record invoice' }).click();

    await expect(page.getByText('Record invoice: saved and approved')).toBeVisible({ timeout: 10_000 });
    await expect(modal).toBeHidden();
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);

    // Reopen it: the entry is listed as approved, and can be reversed with a reason.
    await itemRow('E2E test item').getByRole('button', { name: 'View' }).click();
    await expect(modal.getByText('Approved', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await modal.getByRole('button', { name: 'Reverse' }).click();

    const reverseDialog = page.getByRole('dialog').last();
    await expect(reverseDialog.getByRole('heading', { name: 'Reverse incurred' })).toBeVisible();
    await reverseDialog.getByLabel('Reason', { exact: true }).fill('E2E reversal reason');
    await reverseDialog.getByRole('button', { name: 'Reverse' }).click();

    await expect(page.getByText('Incurred reversed')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await expect(modal.getByText('Reversed', { exact: true }).first()).toBeVisible();

    await closeDialog(page);
  });

  test('cost history lists the entries just made, including the reversal', async () => {
    await page.getByRole('button', { name: 'Cost history' }).click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Cost history' })).toBeVisible();
    await expect(sheet.getByText('E2E test cost record').first()).toBeVisible();
    await expect(sheet.getByText('E2E reversal reason').first()).toBeVisible();

    await closeDialog(page);
  });

  test('sets an allocation rule on a shared cost item', async () => {
    await page.getByRole('button', { name: 'Edit basis' }).click();
    // With several shared items the button opens a menu of them; with one it opens the rule directly.
    const option = page.getByRole('menuitem', { name: 'Perimeter fencing' });
    if (await option.isVisible().catch(() => false)) await option.click();

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

  test('the calculation drawer on Performance shows the real drill-down breakdown', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'performance'));
    await page.getByRole('button', { name: 'View calculation' }).click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'How the profit is worked out' })).toBeVisible();
    // The sum at the top, then the sections it is built from.
    await expect(sheet.getByText('Gross profit', { exact: true })).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Shared costs' })).toBeVisible();

    await closeDialog(page);
  });
});
