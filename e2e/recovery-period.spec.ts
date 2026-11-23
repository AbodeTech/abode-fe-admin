import type { Page } from '@playwright/test';

import { closeDialog, expect, login, test } from './fixtures';

/* ============================================================
 * Finance › Recovery period, in mock mode (lib/mocks/routes/recovery-windows.ts):
 * the list and its tabs, a record, Send terms, and approving a refund.
 * Mock state lives in the dev server's memory, so each test reads what is
 * there before acting rather than assuming a fresh server.
 * ============================================================ */

test.describe.serial('Recovery period', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('lists plans in their window with the stat cards and tabs', async () => {
    await page.goto('/recovery-period');
    await expect(page.getByRole('heading', { name: 'Recovery period' })).toBeVisible();
    await expect(page.getByText('Requests to answer').first()).toBeVisible();
    // Scoped to the desktop table: the mobile cards carry the same text, hidden at this width.
    const table = page.getByRole('table');
    await expect(table.getByRole('row', { name: /Customer A/ })).toBeVisible();
    await expect(table.getByText('Terms sent · waiting for customer')).toBeVisible();
  });

  test('the Requests tab opens a record whose terms start from what the customer asked for', async () => {
    await page.goto('/recovery-period?tab=choices');
    await page.getByRole('table').getByRole('link', { name: /Customer H/ }).first().click();
    await expect(page).toHaveURL(/\/recovery-period\/rw-h$/);
    await expect(page.getByRole('heading', { name: /Customer H · Estate C/ })).toBeVisible();
    await expect(page.getByText('Requests and terms')).toBeVisible();
    // Waiting on admin, not the customer: no reminder to send.
    await expect(page.getByRole('button', { name: 'Send reminder' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Send terms' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('They asked for')).toBeVisible();
    await expect(dialog.getByText('What they asked for', { exact: true })).toBeVisible();
    // Carry-over defaults to everything paid: land ₦5,000,000 + levy ₦600,000.
    await expect(dialog.getByText('₦5,600,000').first()).toBeVisible();
    await closeDialog(page);
  });

  test('a refund to approve is credited, and the record says so', async () => {
    await page.goto('/recovery-period/rw-c');
    await expect(page.getByText('How the refund is worked out')).toBeVisible();
    const approve = page.getByRole('button', { name: /Approve refund ·/ });
    if (await approve.isVisible()) {
      // ₦9,000,000 paid − ₦2,400,000 (20% of ₦12M) − ₦600,000 fee.
      await expect(approve).toContainText('₦6,000,000');
      await approve.click();
      await page.getByRole('dialog').getByRole('button', { name: 'Approve refund' }).click();
    }
    await expect(page.getByText(/credited to the customer’s Abode wallet/)).toBeVisible();
  });
});
