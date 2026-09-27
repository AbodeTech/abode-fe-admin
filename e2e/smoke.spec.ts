import { test, expect, ASSET_WITH_FULL_TREE } from './fixtures';

test('logs in and loads the assets list', async ({ adminPage }) => {
  await adminPage.goto('/assets');
  await expect(adminPage.getByRole('heading', { name: 'Assets' })).toBeVisible();
});

test('loads an asset detail page with its tabs', async ({ adminPage }) => {
  await adminPage.goto(`/assets/${ASSET_WITH_FULL_TREE}`);
  await expect(adminPage.getByRole('link', { name: 'Offers' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Costs & Profitability' })).toBeVisible();
});
