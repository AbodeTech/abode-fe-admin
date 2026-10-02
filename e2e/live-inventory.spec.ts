import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Blocks & Plots tab, as the asset-detail design draws it: the summary strip,
 * block cards and the plot table. Creates a block, bulk-adds plots through
 * the block's editor, and filters the plot table.
 *
 * Ground confirmation, the physical/commercial status matrices and the
 * inventory reconciliation panel are no longer on this tab: none is in the
 * design and none has a backend. Sqm activation moved to the Overview.
 */
test.describe.serial('Live Inventory', () => {
  let page: Page;
  let newBlockLabel: string;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'blocks'));
    // A short, unique label so this run's block doesn't collide with a
    // previous run's leftover (server-side mock state persists across runs
    // within the same dev-server process).
    newBlockLabel = `E${Date.now().toString().slice(-4)}`;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('shows the summary strip, block inventory and plot inventory', async () => {
    await expect(page.getByText('Total physical plots')).toBeVisible();
    await expect(page.getByText('Event capacity remaining')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Block inventory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plot inventory' })).toBeVisible();
  });

  test('creates a new block', async () => {
    await page.getByRole('button', { name: 'Add block' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add new block' })).toBeVisible();
    await dialog.getByLabel('Block label', { exact: true }).fill(newBlockLabel);
    await dialog.getByRole('button', { name: 'Create block' }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);
    await expect(page.getByText(`Block ${newBlockLabel}`)).toBeVisible();
  });

  test('bulk-adds plots to the new block', async () => {
    // Each block card is itself the button that opens that block's plot editor.
    await page.getByRole('button', { name: `Manage plots in Block ${newBlockLabel}` }).click();

    const manageDialog = page.getByRole('dialog');
    await expect(manageDialog.getByRole('heading', { name: `Block ${newBlockLabel}` })).toBeVisible();
    await manageDialog.getByRole('button', { name: 'Add plots' }).click();

    const addPlotsDialog = page.getByRole('dialog').last();
    await expect(addPlotsDialog.getByRole('heading', { name: 'Add plots' })).toBeVisible();
    await addPlotsDialog.getByPlaceholder('1', { exact: true }).fill('1');
    await addPlotsDialog.getByPlaceholder('10', { exact: true }).fill('5');
    await addPlotsDialog.getByPlaceholder('500', { exact: true }).fill('350');
    await addPlotsDialog.getByRole('button', { name: /Create \d+ plots/ }).click();

    await expect(page.getByText('Created 5 plots')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await waitForToastsToClear(page);

    await expect(manageDialog.getByText(`${newBlockLabel}-1`, { exact: true })).toBeVisible();
    await closeDialog(page);
  });

  test('filters the plot inventory by search', async () => {
    const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Plot inventory' }) });
    await panel.getByPlaceholder('Search plot (e.g. A-12)').fill('A-1');
    await expect(panel.getByText('A-1', { exact: true })).toBeVisible();
    await panel.getByPlaceholder('Search plot (e.g. A-12)').fill('');
  });

  test('"Manage plots" on the plot table opens the same block editor', async () => {
    const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Plot inventory' }) });
    await panel.getByRole('button', { name: 'Manage plots' }).click();
    await page.getByRole('menuitem', { name: `Block ${newBlockLabel}` }).click();

    const manageDialog = page.getByRole('dialog');
    await expect(manageDialog.getByRole('heading', { name: `Block ${newBlockLabel}` })).toBeVisible();
    await expect(manageDialog.getByRole('button', { name: 'Delete block' })).toBeVisible();
    await closeDialog(page);
  });
});
