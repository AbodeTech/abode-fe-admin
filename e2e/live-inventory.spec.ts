import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Blocks & Plots tab: create a block, bulk-add plots to it, filter the
 * asset-wide plot inventory, submit + verify a ground confirmation on the
 * seeded allocated plot, and check the physical/commercial status matrices
 * and inventory reconciliation panel all render with the estate's real data.
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

  test('shows blocks, plot inventory, status matrices, and reconciliation', async () => {
    // BlocksManager wraps its title in shadcn's <CardTitle>, a plain <div>
    // with no heading role — unlike this file's other panels, which use a
    // real <h2>.
    await expect(page.getByText('Block inventory')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plot inventory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Physical status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Commercial status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inventory reconciliation' })).toBeVisible();
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
    // The block's own name label is a leaf <p>; its card is the closest
    // bordered ancestor — safer than filtering all <div>s by text, which
    // would also match every wrapping container that happens to contain it.
    const blockCard = page
      .getByText(`Block ${newBlockLabel}`, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    await blockCard.getByRole('button', { name: 'Manage plots' }).click();

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

  test('ground confirmation: verify the seeded pending submission on an allocated plot', async () => {
    const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Plot inventory' }) });
    await panel.getByPlaceholder('Search plot (e.g. A-12)').fill('A-1');

    await expect(panel.getByText('Not ground confirmed')).toBeVisible();
    await panel.getByText('Not ground confirmed').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Ground confirmation' })).toBeVisible();
    await expect(dialog.getByText('Pending verification')).toBeVisible();
    await dialog.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByText('Ground confirmation verified')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await closeDialog(page);

    await expect(panel.getByText('Ground confirmed', { exact: true })).toBeVisible();
    await panel.getByPlaceholder('Search plot (e.g. A-12)').fill('');
  });

  test('inventory reconciliation shows estate totals and an actionable exception', async () => {
    const reconciliation = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Inventory reconciliation' }) });
    await expect(reconciliation.getByText(/ground confirmed/i).first()).toBeVisible();
    await expect(reconciliation.getByText(/more unit\(s\) sold than physically allocated/i).first()).toBeVisible();

    await reconciliation.getByRole('link', { name: 'Manage plots' }).first().click();
    await expect(page).toHaveURL(/#blocks-manager$/);
  });

  test('inventory reconciliation is flagged as demo data, not a live system', async () => {
    const reconciliation = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Inventory reconciliation' }) });
    await expect(reconciliation.getByText('Demo data — not backed by a live system')).toBeVisible();
  });

  test('sqm inventory: reads the real ledger position, then activates it', async () => {
    const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Sqm inventory' }) });
    await expect(panel.getByText('Legacy units', { exact: true })).toBeVisible();
    await expect(panel.getByText('Ready to activate')).toBeVisible();

    await panel.getByRole('button', { name: 'Activate sqm inventory' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('heading', { name: 'Activate sqm inventory?' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Activate' }).click();

    await expect(page.getByText('Sqm inventory activated')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await expect(panel.getByText('Active', { exact: true })).toBeVisible();
  });
});
