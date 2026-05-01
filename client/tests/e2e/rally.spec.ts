import { test, expect } from '@playwright/test';

test.describe('Rally Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rally');
  });

  test('should load active lobbies', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Rally' })).toBeVisible();
  });

  test('should create a new party', async ({ page }) => {
    // Implement party creation test
  });

  test('should join an existing party', async ({ page }) => {
    // Implement join party test
  });
});
