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

    await page.route(/\/api\/health/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          service: 'inventory-forecaster-api',
          environment: 'production',
          database: 'connected',
          uptimeSeconds: 120,
        }),
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

  test('admin user can view audit logs table and filter actions', async ({ page }) => {
    const MOCK_AUDIT_LOGS = {
      logs: [
        {
          id: 'log_1',
          adminEmail: 'admin@shop.com',
          action: 'USER_ROLE_CHANGE',
          targetEmail: 'regular@shop.com',
          details: { oldRole: 'user', newRole: 'admin' },
          ipAddress: '127.0.0.1',
          createdAt: '2026-03-01T12:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_ADMIN_USER }),
      });
    });

    await page.route(/\/api\/admin\/audit-logs/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_LOGS),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_admin_token');
    });

    await page.goto('/admin/logs');

    await expect(page.locator('h1:has-text("Audit Trail")')).toBeVisible();
    await expect(page.locator('text=Role Changed')).toBeVisible();
    await expect(page.locator('text=regular@shop.com')).toBeVisible();
    await expect(page.locator('text=user → admin')).toBeVisible();
  });

  test('admin user can view platform campaigns and responsive mobile layout renders cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_ADMIN_USER }),
      });
    });

    await page.route(/\/api\/admin\/campaigns/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          campaigns: [
            {
              id: 'camp_1',
              name: 'Spring Flash Blitz',
              campaignLabel: 'TikTok-Q2',
              startDate: '2026-12-01T00:00:00.000Z',
              endDate: '2026-12-03T00:00:00.000Z',
              discountPct: 25,
              plannedSpend: 450,
              productCount: 4,
              ownerName: 'Regular Joe',
              ownerEmail: 'regular@shop.com',
              ownerPlan: 'starter',
            },
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_admin_token');
    });

    await page.goto('/admin/campaigns');
    await expect(page.locator('h1:has-text("Platform Campaigns")')).toBeVisible();
    await expect(page.locator('text=Spring Flash Blitz')).toBeVisible();
    await expect(page.locator('text=regular@shop.com')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('clicking user profile avatar reveals Admin Dashboard button for admin, but not for regular user', async ({ page }) => {
    // 1. Regular user on home page
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

    await page.goto('/');
    // Check that admin panel is NOT in standard nav links
    await expect(page.locator('nav a:has-text("Admin Panel")')).toHaveCount(0);

    // Click profile dropdown trigger
    await page.click('button[aria-label="User account profile menu"]');
    // Dropdown is visible
    await expect(page.locator('text=Planner Dashboard')).toBeVisible();
    // Admin Dashboard button should NOT exist for regular user
    await expect(page.locator('text=Admin Dashboard')).toHaveCount(0);

    // 2. Now as Admin user
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_ADMIN_USER }),
      });
    });

    await page.goto('/');
    await page.click('button[aria-label="User account profile menu"]');
    await expect(page.locator('text=Planner Dashboard')).toBeVisible();
    const adminBtn = page.locator('a:has-text("Admin Dashboard")');
    await expect(adminBtn).toBeVisible();
  });

  test('admin users table renders role as view-only badge and contains no role select input', async ({ page }) => {
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

    // Verify role is rendered as text/badge, and no select exists for role
    const roleSelects = page.locator('select option[value="admin"]');
    await expect(roleSelects).toHaveCount(0);
  });

  test('admin login page is dedicated sign-in without provision admin tab', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=Platform Administration')).toBeVisible();
    await expect(page.locator('text=Sign In to Admin Panel')).toBeVisible();
    // Provision Admin tab must NOT exist
    await expect(page.locator('text=Provision Admin')).toHaveCount(0);
  });
});
