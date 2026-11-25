import { test, expect } from '@playwright/test';

const MOCK_ADMIN_USER = {
  id: 'usr_admin_responsive',
  email: 'admin@forecastiq.local',
  name: 'Admin Tester',
  role: 'admin',
  plan: 'scale',
  currency: 'USD',
  emailVerified: true,
};

const MOCK_STATS = {
  totalUsers: 24,
  verifiedUsers: 20,
  planBreakdown: { starter: 12, growth: 8, scale: 4 },
  totalProducts: 120,
  totalCampaigns: 18,
  totalForecasts: 94,
};

const VIEWPORTS = [
  { name: 'Mobile (375px)', width: 375, height: 812 },
  { name: 'Mobile (390px)', width: 390, height: 844 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1024px)', width: 1024, height: 768 },
  { name: 'Wide (1440px)', width: 1440, height: 900 },
];

test.describe('Responsive Cross-Device Layout Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`renders public landing and pricing cleanly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const landingOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(landingOverflow).toBe(false);

      await page.goto('/pricing');
      const pricingOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(pricingOverflow).toBe(false);
    });

    test(`renders admin overview and portal cleanly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

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
            uptimeSeconds: 3600,
          }),
        });
      });

      await page.route(/\/api\/admin\/audit-logs/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ logs: [], total: 0, page: 1, totalPages: 1 }),
        });
      });

      await page.route(/\/api\/admin\/campaigns/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: [], total: 0, page: 1, totalPages: 1 }),
        });
      });

      await page.addInitScript(() => {
        window.localStorage.setItem('ifc_auth_token', 'mock_admin_token');
      });

      await page.goto('/admin');
      await expect(page.locator('h1:has-text("Admin Overview")')).toBeVisible();

      const adminOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(adminOverflow).toBe(false);
    });
  }
});
