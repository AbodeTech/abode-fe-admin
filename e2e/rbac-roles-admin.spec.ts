import type { Page } from '@playwright/test';

import { test, expect, loginAs, closeDialog } from './fixtures';

/* ============================================================
 * Security › Roles and Permissions: create, edit and delete a role, give an admin a role, and link an
 * admin to an Associate Pro user.
 *
 * Mock state is shared and not reset (see playwright.config.ts), so the role this file creates has a name
 * made from the run time, and every step reads state before acting rather than assuming a fresh server.
 * The mock refuses what the backend refuses: no rename, no editing the super-admin role, no deleting a
 * system role or a role somebody still holds.
 * ============================================================ */

const ROLE = `qa_${Date.now().toString(36)}`;
const ADMIN_EMAIL = 'tunde@abode.ng';

const dialog = (page: Page) => page.getByRole('dialog');

async function openRoles(page: Page) {
  await page.goto('/security/roles');
  await expect(page.getByRole('heading', { name: 'Admin Management' })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole('button', { name: /^Actions for / }).first()).toBeVisible();
}

async function openRoleMenu(page: Page, role: string) {
  await page.getByRole('button', { name: `Actions for ${role}` }).click();
}

async function openAccess(page: Page, email: string) {
  await page.getByRole('row').filter({ hasText: email }).first().getByRole('button', { name: 'Change access' }).click();
  await expect(dialog(page)).toBeVisible();
}

test.describe.serial('roles admin', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAs(page, 'e2e.qa@abode.ng'); // any other address is the mock's super admin
    await openRoles(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('protected roles say why Edit or Delete is off', async () => {
    await openRoleMenu(page, 'super_admin');
    const edit = page.getByRole('menuitem', { name: /Edit role/ });
    await expect(edit).toHaveAttribute('aria-disabled', 'true');
    await expect(edit).toContainText('not allowed');
    await page.keyboard.press('Escape');

    await openRoleMenu(page, 'sales_member');
    await expect(page.getByRole('menuitem', { name: /Delete role/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('menuitem', { name: /Delete role/ })).toContainText("system roles can't be deleted");
    // a system role can still be edited
    await expect(page.getByRole('menuitem', { name: /^Edit role$/ })).not.toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
  });

  test('create a custom role', async () => {
    await page.getByRole('button', { name: 'Create Role' }).click();
    await dialog(page).getByLabel('Role name').fill(ROLE);
    await dialog(page).getByLabel('Description').fill('Temporary role for the e2e run');
    await dialog(page).getByLabel('Search permissions').fill('view_users');
    await dialog(page).getByText('view_users', { exact: true }).click();
    await expect(dialog(page)).toContainText(/1 of \d+ selected/);
    await dialog(page).getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('button', { name: `Actions for ${ROLE}` })).toBeVisible();
  });

  test('edit it: the form says what changes and saves only that', async () => {
    await openRoleMenu(page, ROLE);
    await page.getByRole('menuitem', { name: /^Edit role$/ }).click();
    await expect(dialog(page)).toContainText("The name can't be changed");
    await expect(dialog(page).getByRole('button', { name: 'Save changes' })).toBeDisabled();

    await dialog(page).getByLabel('Description').fill('Temporary role, edited');
    await dialog(page).getByLabel('Search permissions').fill('view_campaigns');
    await dialog(page).getByText('view_campaigns', { exact: true }).click();
    await expect(dialog(page)).toContainText('Nobody holds this role yet');
    await expect(dialog(page)).toContainText('Adds 1: view_campaigns');

    await dialog(page).getByLabel('Search permissions').fill('view_users');
    await dialog(page).getByText('view_users', { exact: true }).click();
    await expect(dialog(page)).toContainText('Removes 1: view_users');

    await dialog(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('main')).toContainText('Temporary role, edited');
  });

  test('a role somebody holds cannot be deleted: the dialog lists who holds it', async () => {
    await openAccess(page, ADMIN_EMAIL);
    await dialog(page).getByRole('checkbox', { name: ROLE, exact: true }).click();
    await dialog(page).getByRole('button', { name: 'Save access' }).click();
    await expect(dialog(page)).toBeHidden();

    await openRoleMenu(page, ROLE);
    await page.getByRole('menuitem', { name: /Delete role/ }).click();
    await expect(dialog(page)).toContainText('still held by 1 admin');
    await expect(dialog(page)).toContainText('Tunde');
    await expect(dialog(page).getByRole('button', { name: 'Delete role' })).toHaveCount(0);
    await closeDialog(page);
  });

  test('once nobody holds it, deleting asks for confirmation and removes the role', async () => {
    await openAccess(page, ADMIN_EMAIL);
    await dialog(page).getByRole('checkbox', { name: ROLE, exact: true }).click();
    await dialog(page).getByRole('button', { name: 'Save access' }).click();
    await expect(dialog(page)).toBeHidden();

    await openRoleMenu(page, ROLE);
    await page.getByRole('menuitem', { name: /Delete role/ }).click();
    await expect(dialog(page)).toContainText('Nobody holds it');
    await dialog(page).getByRole('button', { name: 'Delete role' }).click();
    await expect(page.getByRole('button', { name: `Actions for ${ROLE}` })).toHaveCount(0);
  });
});

test.describe.serial('Associate Pro link', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAs(page, 'e2e.qa@abode.ng');
    await openRoles(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  const openProTab = async (email: string) => {
    await openAccess(page, email);
    await dialog(page).getByRole('tab', { name: /Associate Pro/ }).click();
  };

  test('link an admin to an Associate Pro user', async () => {
    await openProTab('ife@abode.ng');
    // Ife may already be linked from an earlier run on this server: start from "not linked".
    if (await dialog(page).getByRole('button', { name: 'Remove link' }).isVisible()) {
      await dialog(page).getByRole('button', { name: 'Remove link' }).click();
      await dialog(page).getByRole('button', { name: 'Save access' }).click();
      await expect(dialog(page)).toBeHidden();
      await openProTab('ife@abode.ng');
    }
    await expect(dialog(page)).toContainText('Not linked');

    await dialog(page).getByLabel('Search Associate Pros').fill('John');
    await dialog(page).getByRole('button', { name: /John/ }).first().click();
    await expect(dialog(page)).toContainText('Selected');
    await dialog(page).getByRole('button', { name: 'Save access' }).click();
    await expect(dialog(page)).toBeHidden();
  });

  test('the same user cannot be linked to a second admin: the backend\'s message shows', async () => {
    await openProTab(ADMIN_EMAIL);
    await dialog(page).getByLabel('Search Associate Pros').fill('John');
    await dialog(page).getByRole('button', { name: /John/ }).first().click();
    await dialog(page).getByRole('button', { name: 'Save access' }).click();
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'already linked to another admin' })).toBeVisible();
    await expect(dialog(page)).toBeVisible(); // stays open: nothing the person did is lost
    await closeDialog(page);
  });

  test('reopening shows who is linked, and the link can be removed', async () => {
    await openProTab('ife@abode.ng');
    await expect(dialog(page)).toContainText('John');
    await expect(dialog(page)).not.toContainText('Not linked');
    await dialog(page).getByRole('button', { name: 'Remove link' }).click();
    await dialog(page).getByRole('button', { name: 'Save access' }).click();
    await expect(dialog(page)).toBeHidden();

    await openProTab('ife@abode.ng');
    await expect(dialog(page)).toContainText('Not linked');
  });
});
