import { test, expect } from '@playwright/test';

const MOCK_USER = {
  id: 'usr_test_123',
  email: 'admin@shop.com',
  name: 'Store Admin',
  role: 'admin',
  plan: 'growth',
  currency: 'USD',
  emailVerified: true,
  notificationPreferences: { emailStockoutAlerts: true },
};

const MOCK_SALES = [
  {
    id: 'sale_1',
    name: 'Summer Flash Sale 2026',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-03T23:59:59.000Z',
    discountPct: 25,
    plannedSpend: 500,
    skus: ['TEE-BLK-S', 'HOODIE-GRY-L'],
  },
];

const MOCK_FORECASTS = [
  {
    sku: 'TEE-BLK-S',
    status: 'ok',
    low: 80,
    expected: 150,
    high: 220,
    baselineDailyUnits: 20,
    upliftRatio: 2.5,
    unitsAvailable: 50,
    riskLevel: 'high',
    expectedRunOutTime: '2026-07-01T14:00:00.000Z',
  },
  {
    sku: 'HOODIE-GRY-L',
    status: 'ok',
    low: 30,
    expected: 60,
    high: 90,
    baselineDailyUnits: 10,
    upliftRatio: 2.0,
    unitsAvailable: 100,
    riskLevel: 'low',
    expectedRunOutTime: null,
  },
];

const MOCK_PRODUCTS = [
  {
    sku: 'TEE-BLK-S',
    name: 'Black Crewneck T-Shirt Small',
    category: 'Apparel',
    price: 25.0,
    costPrice: 8.5,
  },
  {
    sku: 'HOODIE-GRY-L',
    name: 'Oversized Fleece Hoodie Grey',
    category: 'Apparel',
    price: 65.0,
    costPrice: 22.0,
  },
];

test.describe('Authenticated Planner Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API routes with mock responses
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_USER }),
      });
    });

    await page.route(/\/api\/forecast\/alerts/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ alerts: [] }),
      });
    });

    await page.route(/\/api\/sales/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ saleEvents: MOCK_SALES }),
      });
    });

    await page.route(/\/api\/forecast\/latest/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          forecastRun: { id: 'run_1', createdAt: new Date().toISOString() },
          forecasts: MOCK_FORECASTS,
        }),
      });
    });

    await page.route(/\/api\/products/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: MOCK_PRODUCTS }),
      });
    });

    await page.route(/\/api\/auth\/usage/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'growth',
          usage: { products: 2, sales: 1 },
        }),
      });
    });

    await page.route(/\/api\/auth\/profile/, async (route) => {
      const postData = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { ...MOCK_USER, currency: postData.currency, name: postData.name },
        }),
      });
    });

    // Hydrate auth token in localStorage before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('ifc_auth_token', 'mock_jwt_token_for_e2e_tests');
    });
  });

  test('authenticated user can view dashboard, scenario metrics, and risk badges', async ({ page }) => {
    await page.goto('/dashboard');

    // Header & Sale selection
    await expect(page.locator('h1')).toContainText('Flash Sale Demand Forecaster');
    await expect(page.locator('select').first()).toHaveValue('sale_1');

    // Table SKUs and Risk Badge
    await expect(page.locator('text=TEE-BLK-S').first()).toBeVisible();
    await expect(page.locator('text=High Risk').first()).toBeVisible();
    await expect(page.locator('text=HOODIE-GRY-L').first()).toBeVisible();
  });

  test('authenticated user can open supplier restock sheet and trigger direct PO CSV download', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Supplier Restock Sheet modal trigger
    await page.locator('button:has-text("Supplier PO Sheet")').click();

    // Modal should be visible — check the actual header text in the component
    await expect(page.locator('text=Supplier Restock & Purchase Order Preview')).toBeVisible();
    await expect(page.locator('text=Auto-Drafted from forecast')).toBeVisible();
    await expect(page.locator('text=TEE-BLK-S').first()).toBeVisible();

    // Trigger PO CSV export and verify download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export PO (CSV)")').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('authenticated user can update preferred currency in settings', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.locator('h1')).toContainText('Account Settings & Preferences');
    await expect(page.locator('text=Preferred Store Currency')).toBeVisible();

    // Change currency select to EUR
    await page.locator('select').first().selectOption('EUR');

    // Click save
    await page.locator('button:has-text("Save Profile & Preferences")').click();

    // Success notification
    await expect(
      page.locator('text=Profile, currency, and notification preferences saved.').first(),
    ).toBeVisible();
  });

  test('authenticated user can download starter CSV templates on import page', async ({ page }) => {
    await page.goto('/import');

    await expect(page.locator('h1')).toContainText('CSV Data Import');

    // Trigger template download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download Starter Template")').first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('products_template.csv');
  });
});
