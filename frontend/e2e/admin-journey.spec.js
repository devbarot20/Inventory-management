import { test, expect } from '@playwright/test';

const MOCK_ADMIN_USER = {
  id: 'usr_admin_999',
  email: 'admin@shop.com',
  name: 'Super Admin',
  role: 'admin',
  plan: 'scale',
  currency: 'USD',
  emailVerified: true,
};

const MOCK_REGULAR_USER = {
  id: 'usr_user_111',
  email: 'regular@shop.com',
  name: 'Regular Joe',
  role: 'user',
  plan: 'starter',
  currency: 'USD',
  emailVerified: true,
};

const MOCK_STATS = {
  totalUsers: 14,
  verifiedUsers: 12,
  planBreakdown: { starter: 8, growth: 4, scale: 2 },
  totalProducts: 45,
  totalCampaigns: 10,
  totalForecasts: 28,
};

const MOCK_USERS_LIST = {
  users: [
    {
      id: 'usr_admin_999',
      name: 'Super Admin',
      email: 'admin@shop.com',
      role: 'admin',
      plan: 'scale',
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_user_111',
      name: 'Regular Joe',
      email: 'regular@shop.com',
      role: 'user',
      plan: 'starter',
      emailVerified: true,
      createdAt: '2026-02-15T00:00:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  totalPages: 1,
};

test.describe('Admin Panel Journey', () => {
  test('redirects unauthenticated users away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('redirects non-admin users away from /admin', async ({ page }) => {
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_REGULAR_USER }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_regular_token');
    });

    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('admin user can view admin overview dashboard with stats', async ({ page }) => {
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_ADMIN_USER }),
      });
    });

    await page.route(/\/api\/admin\/stats/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATS),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_admin_token');
    });

    await page.goto('/admin');

    await expect(page.locator('h1:has-text("Admin Overview")')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Products')).toBeVisible();
    await expect(page.locator('text=Plan Distribution')).toBeVisible();
    await expect(page.locator('text=Manage Users →')).toBeVisible();
  });

  test('admin user can view user management table and search', async ({ page }) => {
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_ADMIN_USER }),
      });
    });

    await page.route(/\/api\/admin\/users/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS_LIST),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_admin_token');
    });

    await page.goto('/admin/users');

    await expect(page.locator('h1:has-text("User Management")')).toBeVisible();
    await expect(page.locator('text=regular@shop.com')).toBeVisible();
    await expect(page.locator('text=admin@shop.com')).toBeVisible();
    // Admin's own row displays "You" pill
    await expect(page.locator('text=You')).toBeVisible();
  });
});
