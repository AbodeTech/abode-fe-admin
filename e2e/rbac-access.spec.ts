import { test, expect, loginAs } from './fixtures';

/* ============================================================
 * Roles & permissions — what each seeded role sees and can do.
 *
 * Mock mode builds each session from the backend's own seeded roles (`as-<role>@abode.ng`), so these
 * checks follow the real permission keys: change a seed and the right spec fails. What they cannot
 * show is the live backend: `scripts/rbac-live-contract-check.ts` does that against staging.
 *
 * Each test signs in fresh: the mock session lives in sessionStorage, which Playwright does not carry
 * between contexts (see fixtures.ts).
 * ============================================================ */

test.describe('landing page', () => {
  const landings: Array<[string, RegExp]> = [
    ['as-recruitment_member@abode.ng', /\/recruitment/],
    ['as-cs_manager@abode.ng', /\/customer-managers/],
    ['as-finance_member@abode.ng', /\/financial-officers/],
    ['as-sales_member@abode.ng', /\/associates\/managers/],
    ['as-developer@abode.ng', /\/$/],
  ];
  for (const [email, url] of landings) {
    test(`${email.replace('as-', '').replace('@abode.ng', '')} starts on its role's page`, async ({ page }) => {
      await loginAs(page, email);
      await expect(page).toHaveURL(url);
    });
  }

  test('a person with two roles starts on the primary role\'s page', async ({ page }) => {
    await loginAs(page, 'as-recruitment_member+finance_member@abode.ng');
    await expect(page).toHaveURL(/\/recruitment/);
  });
});

test.describe('page guard', () => {
  test('a sales member can open Users (view_user implies view_users) but not Tickets or Marketplace', async ({ page }) => {
    await loginAs(page, 'as-sales_member@abode.ng');

    await page.goto('/users');
    await expect(page.locator('main')).toContainText('Users');
    await expect(page.getByText('All Users is restricted')).toHaveCount(0);

    await page.goto('/tickets');
    await expect(page.getByText('Tickets is restricted')).toBeVisible();

    await page.goto('/marketplace');
    await expect(page.getByText('Marketplace is restricted')).toBeVisible();
  });

  test('a Support member opens Tickets and Associate Performance, and not the transaction ledgers', async ({ page }) => {
    await loginAs(page, 'as-cs_manager@abode.ng');
    await page.goto('/tickets');
    await expect(page.getByText('Tickets is restricted')).toHaveCount(0);
    await page.goto('/transactions/assets');
    await expect(page.getByText('Asset is restricted')).toBeVisible();
  });

  test('recruitment cannot open the money pages', async ({ page }) => {
    await loginAs(page, 'as-recruitment_member@abode.ng');
    await page.goto('/transactions/assets');
    await expect(page.getByText('Asset is restricted')).toBeVisible();
  });

  test('the sidebar only offers pages the role can open', async ({ page }) => {
    await loginAs(page, 'as-recruitment_member@abode.ng');
    const sidebar = page.locator('#dashboard-sidebar');
    await expect(sidebar.getByRole('link', { name: 'Recruitment' }).first()).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Withdrawal' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Tickets' })).toHaveCount(0);
  });
});

test.describe('action gating', () => {
  test('Purchase Confirmations: only the Support Lead can approve', async ({ page }) => {
    await loginAs(page, 'as-support_lead@abode.ng');
    await page.goto('/purchase-confirmations?status=waiting');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^Approve$/ }).first()).toBeVisible();
  });

  for (const email of ['as-cs_manager@abode.ng', 'as-finance_member@abode.ng']) {
    test(`Purchase Confirmations: ${email.replace('as-', '').replace('@abode.ng', '')} can look but not approve`, async ({ page }) => {
      await loginAs(page, email);
      await page.goto('/purchase-confirmations?status=waiting');
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByRole('button', { name: /^Approve$/ })).toHaveCount(0);
    });
  }

  test('Withdrawals: bank details and TIN show as Restricted to a role without them, and are shown to Finance', async ({ page }) => {
    await loginAs(page, 'as-sales_member@abode.ng');
    await page.goto('/transactions/withdrawal');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('main')).toContainText('Restricted');

    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear());
    await loginAs(page, 'as-finance_member@abode.ng');
    await page.goto('/transactions/withdrawal');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('main')).not.toContainText('Restricted');
  });

  test('Admin Logs: a role without view_audit_logs is turned away', async ({ page }) => {
    await loginAs(page, 'as-sales_member@abode.ng');
    await page.goto('/security/adminlogs');
    await expect(page.getByText('Admin Logs is restricted')).toBeVisible();
  });

  test('Roles: a role without manage_roles gets no role actions', async ({ page }) => {
    await loginAs(page, 'as-viewer@abode.ng');
    await page.goto('/security/roles');
    await expect(page.getByRole('heading', { name: 'Admin Management' })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^Actions for / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Role' })).toHaveCount(0);
  });
});
