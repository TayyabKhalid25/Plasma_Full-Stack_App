import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  // Use more specific selectors matching the actual UI
  await page.getByPlaceholder('Enter your username or email').fill('Wahaj');
  await page.getByLabel('Password').or(page.getByPlaceholder('Enter your password')).fill('password123');
  
  await page.getByRole('button', { name: 'Log In' }).click();

  // Wait for navigation to dashboard to confirm session is active
  await page.waitForURL('**/pulse', { timeout: 10000 }); // Assuming pulse is the default dashboard
  
  await page.context().storageState({ path: authFile });
});
