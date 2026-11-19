import { type Page, type Browser } from '@playwright/test';
import { test, expect, login } from './fixtures';

/**
 * Sales page — applying a filter must not tear the page down.
 *
 * A new filter is a new query key with no cached data. The page used to return a
 * bare spinner while that loaded, which unmounted the title, filter bar, cards
 * and table and remounted them on arrival. These tests mark real DOM nodes, apply
 * a filter, and fail if a marked node is gone (a remounted node loses its mark).
 * The mock responds instantly, but the old early return still committed the
 * spinner for at least one render, so the marks were lost every time.
 */
test.describe.serial('Sales filters', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  const mark = () =>
    page.evaluate(() => {
      document.querySelector('h1')?.setAttribute('data-qa-mark', 'title');
      document.querySelector('[role="combobox"]')?.setAttribute('data-qa-mark', 'filter');
    });

  const survivors = () =>
    page.evaluate(() => ({
      title: Boolean(document.querySelector('[data-qa-mark="title"]')),
      filter: Boolean(document.querySelector('[data-qa-mark="filter"]')),
    }));

  test('loads the sales page', async () => {
    await page.goto('/sales');
    await expect(page.getByRole('heading', { name: 'Sales', exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByPlaceholder(/Search buyer/)).toBeVisible();
    await expect(page.locator('table tbody tr').first().or(page.getByText('No sales records found').first())).toBeVisible();
    await mark();
    expect(await survivors()).toEqual({ title: true, filter: true });
  });

  test('a search keeps the title and filter bar mounted', async () => {
    const search = page.getByPlaceholder(/Search buyer/);
    await search.fill('a');
    await search.press('Enter');
    await expect(page).toHaveURL(/q=a/);
    // Sample straight after the URL change, which is when the spinner used to take over.
    for (let i = 0; i < 6; i += 1) {
      expect(await survivors(), `sample ${i}`).toEqual({ title: true, filter: true });
      await page.waitForTimeout(100);
    }
  });

  test('a select filter keeps the title and filter bar mounted', async () => {
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').nth(1).click();
    await expect(page).toHaveURL(/assettype=/);
    for (let i = 0; i < 6; i += 1) {
      expect(await survivors(), `sample ${i}`).toEqual({ title: true, filter: true });
      await page.waitForTimeout(100);
    }
  });

  test('the table is back with its rows or its empty message after filtering', async () => {
    await expect(page.locator('table tbody tr').first().or(page.getByText('No sales records found').first())).toBeVisible();
    // No page-level spinner is left behind once the results arrive.
    await expect(page.locator('main .animate-spin')).toHaveCount(0);
  });
});
