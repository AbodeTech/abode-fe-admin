import { type Page, type Browser } from '@playwright/test';
import { test, expect, login, closeDialog, waitForToastsToClear, waitForBodyUnlocked, assetTabUrl, ASSET_WITH_FULL_TREE } from './fixtures';

/**
 * Flex 2.0 admin: the Offers tab's pricing column, the pricing editor, the
 * pricing entries in History, converting a tenor-list size, a new unpriced
 * size, and the Streaks & Points card on the user Summary — each with the
 * recorded decisions applied to the mockup (fixed 36-month base tenor, calculated
 * payments, no Finance approval reference).
 *
 * Aviation City's Flex offer seeds three sizes: two on a base plan (live v2) and
 * one on a hand-entered tenor list. Mock state lives in the dev server's memory,
 * so these tests read before acting and assert on the delta.
 */
const USER_WITH_STREAK = '665fcccc00000000000000c1';
const USER_WITHOUT_STREAK = '665fcccc00000000000000c2';

test.describe.serial('Flex 2.0 pricing (admin)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  const flexCard = () => page.locator('section').filter({ has: page.getByRole('heading', { name: 'Flex', exact: true }) });
  const sheet = () => page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: /Flex pricing/ }) });

  test('the Flex offer lists its sizes with pricing mode, version and one action each', async () => {
    await page.goto(assetTabUrl(ASSET_WITH_FULL_TREE, 'offers'));
    const card = flexCard();
    await expect(card.getByText('Allocation qualification 30%')).toBeVisible();
    for (const heading of ['Size', 'Units available', 'Pricing', 'Price version', 'Status']) {
      await expect(card.getByRole('columnheader', { name: heading })).toBeVisible();
    }
    await expect(card.getByText('Base plan').first()).toBeVisible();
    await expect(card.getByText('Pricing v2').first()).toBeVisible();
    await expect(card.getByText(/36 mo · 5% @ 24 · 15% @ 12/).first()).toBeVisible();
    await expect(card.getByText('Tenor list').first()).toBeVisible();
    await expect(card.getByText(/hand-entered plans: 12 · 24 · 36 months/).first()).toBeVisible();
    await expect(card.getByRole('button', { name: 'Edit pricing' }).first()).toBeVisible();
    await expect(card.getByRole('button', { name: 'Convert to base plan' })).toBeVisible();
  });

  test('full-ownership offers keep their plans table untouched', async () => {
    const fo = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Full ownership', exact: true }) });
    await expect(fo.getByRole('columnheader', { name: 'Tenor' }).first()).toBeVisible();
    await expect(fo.getByRole('columnheader', { name: 'Land price' }).first()).toBeVisible();
    await expect(fo.getByRole('button', { name: 'Add plan' }).first()).toBeVisible();
  });

  test('the editor applies the recorded decisions to the mockup', async () => {
    await flexCard().getByRole('button', { name: 'Edit pricing' }).first().click();
    const dialog = sheet();
    await expect(dialog.getByRole('heading', { name: 'Flex pricing · 300 sqm' })).toBeVisible();
    await expect(dialog.getByText(/Draft v3 · based on v2/)).toBeVisible();
    await expect(dialog.getByText('One base plan and two discount checkpoints. Every other whole month is calculated.')).toBeVisible();

    // D01: a fixed base tenor — no maximum-tenor control, and nothing about open decisions.
    await expect(dialog.getByLabel('Base tenor (months)')).toHaveValue('36');
    await expect(dialog.getByLabel('Base tenor (months)')).toHaveJSProperty('readOnly', true);
    await expect(dialog.getByText(/Maximum tenor/i)).toHaveCount(0);
    await expect(dialog.getByText(/Open decision/i)).toHaveCount(0);
    // Q9: no Finance approval reference.
    await expect(dialog.getByText(/Finance approval/i)).toHaveCount(0);
    // D02: first and monthly payment are calculated, so read-only.
    await expect(dialog.getByLabel('First payment (₦)')).toHaveJSProperty('readOnly', true);
    await expect(dialog.getByLabel('Monthly payment (₦)')).toHaveJSProperty('readOnly', true);

    await expect(dialog.getByLabel('Checkpoint 1 months')).toHaveValue('24');
    await expect(dialog.getByLabel('Checkpoint 2 months')).toHaveValue('12');
    await expect(dialog.getByLabel('Checkpoint 1 discount percent')).toHaveValue('5');
    await expect(dialog.getByLabel('Checkpoint 2 discount percent')).toHaveValue('15');
    await expect(dialog.getByText('All checks pass.')).toBeVisible();
  });

  test('the preview lists every whole month from 36 down to 12 with interpolated discounts', async () => {
    const dialog = sheet();
    const rows = dialog.locator('tbody tr');
    await expect(rows).toHaveCount(25);
    await expect(rows.first()).toContainText('36');
    await expect(rows.first()).toContainText('base');
    await expect(rows.last()).toContainText('12');
    await expect(rows.last()).toContainText('checkpoint');
    await expect(rows.last()).toContainText('15%');
    // 30 months sits halfway to the 24-month checkpoint: 2.5%. 22 months is two-twelfths of the way to 12: 6⅔%.
    await expect(dialog.locator('tbody tr', { hasText: /^30/ })).toContainText('2.5%');
    await expect(dialog.locator('tbody tr', { hasText: /^22/ })).toContainText('6⅔%');
    // The last column is the largest single payment; "same" shows where the final payment equals the regular one.
    await expect(rows.first()).toContainText('same');
  });

  test('a checkpoint that makes a shorter plan cost more blocks publishing and says why', async () => {
    const dialog = sheet();
    await dialog.getByLabel('Checkpoint 1 discount percent').fill('20');
    await expect(dialog.getByText(/The 24-month discount \(20%\) is larger than the 12-month discount \(15%\)\. A shorter plan must never cost more\./)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Publish as v3' })).toBeDisabled();
    await expect(dialog.getByText(/Publishing is blocked until the problems above are fixed\. The live version \(v2\) stays active\./)).toBeVisible();
    // The preview doesn't invent numbers for an invalid configuration.
    await expect(dialog.locator('tbody tr').first()).toContainText('—');
  });

  test('publishing creates the next version and the badge says so', async () => {
    const dialog = sheet();
    await dialog.getByLabel('Checkpoint 1 discount percent').fill('6');
    await dialog.getByLabel('Checkpoint 2 discount percent').fill('16');
    await expect(dialog.getByText(/Publishing creates v3\. New quotes use it; existing purchases keep the version they were bought under\./)).toBeVisible();
    await dialog.getByRole('button', { name: 'Publish as v3' }).click();

    await expect(page.getByText('Pricing v3 is live')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('Published · v3')).toBeVisible();
    await waitForToastsToClear(page);
    await closeDialog(page);

    const card = flexCard();
    await expect(card.getByText('Pricing v3').first()).toBeVisible();
    await expect(card.getByText(/36 mo · 6% @ 24 · 16% @ 12/).first()).toBeVisible();
  });

  test('saving a draft changes nothing for customers and is picked up next time', async () => {
    await flexCard().getByRole('button', { name: 'Edit pricing' }).first().click();
    const dialog = sheet();
    await expect(dialog.getByText(/Draft v4 · based on v3/)).toBeVisible();
    await dialog.getByLabel('Checkpoint 2 discount percent').fill('18');
    await dialog.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Draft saved — customers are not affected')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await closeDialog(page);

    await expect(flexCard().getByText(/36 mo · 6% @ 24 · 16% @ 12/).first()).toBeVisible();

    await flexCard().getByRole('button', { name: 'Edit pricing' }).first().click();
    await expect(sheet().getByLabel('Checkpoint 2 discount percent')).toHaveValue('18');
    await closeDialog(page);
  });

  test('History records the publish with its purchase count, and says earlier buyers are untouched', async () => {
    await flexCard().getByRole('button', { name: 'History' }).click();
    const history = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Offer configuration history' }) });
    await expect(history.getByText('Pricing published').first()).toBeVisible();
    await expect(history.getByText(/300 sqm · Pricing v3 — 6% @ 24, 16% @ 12/)).toBeVisible();
    await expect(history.getByText('0 purchases so far')).toBeVisible();
    await expect(history.getByText(/doesn't touch earlier purchases/)).toBeVisible();
    await closeDialog(page);
  });

  test('a tenor-list size keeps its hand-entered plans, editable, until it is converted', async () => {
    const card = flexCard();
    await card.getByRole('button', { name: /Show the hand-entered plans/ }).first().click();
    for (const tenor of ['12 months', '24 months', '36 months']) {
      await expect(card.locator('tr', { hasText: tenor }).first()).toBeVisible();
    }
    await expect(card.getByRole('button', { name: 'Add plan' }).first()).toBeVisible();
    await card.getByRole('button', { name: 'Plan actions' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('a tenor-list size converts to a base plan, pre-filled from its 36-month price, never guessed', async () => {
    await flexCard().getByRole('button', { name: 'Convert to base plan' }).click();
    const dialog = sheet();
    await expect(dialog.getByText(/Draft v1 · converting from a tenor list/)).toBeVisible();
    // The backend refuses a draft on a tenor-list size, so a conversion offers only Convert.
    await expect(dialog.getByRole('button', { name: 'Save draft' })).toHaveCount(0);

    // The existing 36-month land price pre-fills the base price; discounts are left for the admin to set.
    await expect(dialog.getByLabel('Base price per unit (₦)')).not.toHaveValue('');
    await expect(dialog.getByLabel('Checkpoint 1 discount percent')).toHaveValue('');
    await expect(dialog.getByRole('button', { name: 'Convert to base plan' })).toBeDisabled();
    await expect(dialog.getByText('Enter the base price and both discounts to see the preview and publish.')).toBeVisible();

    await dialog.getByLabel('Checkpoint 1 discount percent').fill('5');
    await dialog.getByLabel('Checkpoint 2 discount percent').fill('15');
    await expect(dialog.getByText(/Converting creates v1\. New quotes use it; existing buyers keep the plans they were bought under\./)).toBeVisible();
    await dialog.getByRole('button', { name: 'Convert to base plan' }).click();

    await expect(page.getByText('Converted to a base plan — Pricing v1 is live')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await closeDialog(page);

    await expect(flexCard().getByRole('button', { name: 'Convert to base plan' })).toHaveCount(0);
    await expect(flexCard().getByText('Pricing v1').first()).toBeVisible();
  });

  test('a new Flex size is created with no placeholder plan and is not priced yet', async () => {
    await flexCard().getByRole('button', { name: 'Add size' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Size', { exact: true }).fill('150');
    await dialog.getByLabel('Configured units', { exact: true }).fill('4');
    await dialog.getByRole('button', { name: 'Add size' }).click();
    await expect(page.getByText('Size added — set its pricing next')).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await waitForBodyUnlocked(page);

    const row = flexCard().locator('tbody tr', { hasText: '150 sqm' });
    await expect(row.getByText('Not priced yet')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Set pricing' })).toBeVisible();
    await expect(row.getByText('—')).toBeVisible();
  });

  test('the size chips switch the editor between sizes', async () => {
    await flexCard().getByRole('button', { name: 'Edit pricing' }).first().click();
    const dialog = sheet();
    await dialog.getByRole('button', { name: '500 sqm' }).click();
    await expect(dialog.getByRole('heading', { name: 'Flex pricing · 500 sqm' })).toBeVisible();
    await dialog.getByRole('button', { name: '150 sqm' }).click();
    await expect(dialog.getByRole('heading', { name: 'Flex pricing · 150 sqm' })).toBeVisible();
    await expect(dialog.getByLabel('Base price per unit (₦)')).toHaveValue('');
    await expect(dialog.getByText(/Draft v1 · first version/)).toBeVisible();
    await closeDialog(page);
  });

  test('creating a Flex plan by hand offers Enable streaks, on by default', async () => {
    await page.goto(`/users/${USER_WITH_STREAK}`);
    await page.getByRole('button', { name: 'Create payment plan' }).click();
    await page.getByRole('menuitem', { name: 'Flex', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const toggle = dialog.getByRole('checkbox', { name: 'Enable streaks' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();
    await expect(dialog.getByText(/neither earns nor blocks the customer's account-wide streak/)).toBeVisible();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await closeDialog(page);

    // Full ownership has no streak toggle: the decision and the contract cover manually created Flex plans.
    await page.getByRole('button', { name: 'Create payment plan' }).click();
    await page.getByRole('menuitem', { name: 'Full ownership' }).click();
    await expect(page.getByRole('dialog').getByRole('checkbox', { name: 'Enable streaks' })).toHaveCount(0);
    await closeDialog(page);
  });

  /** The Points balance figure on the card, read from the page so a used server can't throw the test off. */
  const readPoints = async () =>
    Number((await page.getByText('Points balance').locator('xpath=ancestor::div[2]').locator('p').nth(1).innerText()).replace(/,/g, ''));

  test('the user Summary shows Streaks & Points; a streak adjustment needs a reason and leaves points alone', async () => {
    await page.goto(`/users/${USER_WITH_STREAK}`);
    await expect(page.getByText('Streaks & Points', { exact: true })).toBeVisible();
    await expect(page.getByText('Active streak')).toBeVisible();
    await expect(page.getByText('Best streak')).toBeVisible();
    const pointsBefore = await readPoints();

    await page.getByRole('button', { name: 'Adjust streak' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Points correction (optional)')).toBeVisible();
    await expect(dialog.getByText(/20 to 500 characters/)).toBeVisible();
    // Read where the streak is now (a used server may not be at its seeded value) and move it by one.
    const current = Number((await dialog.getByText(/^Currently \d+\./).innerText()).match(/\d+/)![0]);
    const target = current + 1;
    await dialog.getByLabel('Current streak (months)').fill(String(target));
    await dialog.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(dialog.getByText(/Reason must be at least 20 characters/)).toBeVisible();

    await dialog.getByLabel('Reason').fill('Bank transfer verified on time, approved late (ticket 4411)');
    await dialog.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(page.getByText(`Streak adjusted from ${current} to ${target}`)).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    await expect(page.getByText(`${target} months`, { exact: true }).first()).toBeVisible();
    expect(await readPoints()).toBe(pointsBefore); // no correction was entered, so points are untouched
    await expect(page.getByText(/Last adjusted by .* — Bank transfer verified on time/)).toBeVisible();
  });

  test('a points correction changes points, can be negative, and cannot go below zero', async () => {
    await page.goto(`/users/${USER_WITH_STREAK}`);
    await expect(page.getByText('Points balance')).toBeVisible();
    const before = await readPoints();

    await page.getByRole('button', { name: 'Adjust streak' }).click();
    const dialog = page.getByRole('dialog');
    // Streak left as it is: a points-only correction is allowed, but an empty one is not.
    await dialog.getByLabel('Reason').fill('Goodwill correction after the March reversal (ticket 4412)');
    await dialog.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(dialog.getByText('Change the streak or enter a points correction')).toBeVisible();

    // The balance can't be taken below zero — said before any round trip.
    await dialog.getByLabel('Points correction (optional)').fill(String(-(before + 1)));
    await dialog.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(dialog.getByText(/This would take the balance below zero/)).toBeVisible();

    await dialog.getByLabel('Points correction (optional)').fill('150');
    await dialog.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(page.getByText(`points ${before.toLocaleString()} → ${(before + 150).toLocaleString()}`)).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    expect(await readPoints()).toBe(before + 150);

    // And a negative correction takes points off.
    await page.getByRole('button', { name: 'Adjust streak' }).click();
    const again = page.getByRole('dialog');
    await again.getByLabel('Points correction (optional)').fill('-100');
    await again.getByLabel('Reason').fill('Reversing part of the goodwill correction (ticket 4412)');
    await again.getByRole('button', { name: 'Adjust streak' }).click();
    await expect(page.getByText(`points ${(before + 150).toLocaleString()} → ${(before + 50).toLocaleString()}`)).toBeVisible({ timeout: 10_000 });
    await waitForToastsToClear(page);
    expect(await readPoints()).toBe(before + 50);
  });

  test('a customer with no streak-enabled plan shows no active streak but keeps Best streak and real points', async () => {
    await page.goto(`/users/${USER_WITHOUT_STREAK}`);
    await expect(page.getByText('No streak-enabled plan, so there is no active streak.')).toBeVisible();
    // No active streak (shown as "—"), but the best streak earned is real and stays (D12).
    await expect(page.getByText('Best streak')).toBeVisible();
    await expect(page.getByText('Active streak').locator('xpath=ancestor::div[2]').getByText('—')).toBeVisible();
    expect(await readPoints()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: 'Adjust streak' })).toBeDisabled();
  });
});
