import { test, expect } from '@playwright/test';

test.describe('E2E Smoke Tests', () => {
  test('landing page loads with navigation and hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Inventory/i);
    await expect(page.locator('text=Never run out of stock during a').first()).toBeVisible();
    await expect(page.locator('nav').first()).toBeVisible();
    await expect(page.locator('text=ForecastIQ').first()).toBeVisible();
  });

  test('pricing page displays plans and tier features', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Simple plans that grow with you').first()).toBeVisible();
    await expect(page.locator('text=Starter').first()).toBeVisible();
    await expect(page.locator('text=Growth').first()).toBeVisible();
    await expect(page.locator('text=Scale').first()).toBeVisible();
  });

  test('public informational pages render cleanly', async ({ page }) => {
    for (const route of ['/about', '/blog', '/contact', '/privacy', '/terms']) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('protected pages enforce authentication guard when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Sign In').first()).toBeVisible();

    await page.goto('/products');
    await expect(page.locator('text=Sign In').first()).toBeVisible();

    await page.goto('/settings');
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('clicking Sign In opens authentication modal with inputs', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button:has-text("Sign In")').click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});


