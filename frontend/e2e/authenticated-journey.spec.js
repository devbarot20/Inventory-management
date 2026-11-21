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
    supplierName: 'Apex Garments',
    leadTimeDays: 7,
  },
  {
    sku: 'HOODIE-GRY-L',
    name: 'Oversized Fleece Hoodie Grey',
    category: 'Apparel',
    price: 65.0,
    costPrice: 22.0,
    supplierName: 'Apex Garments',
    leadTimeDays: 7,
  },
];

const MOCK_COMPARISON = {
  summary: {
    totalSkus: 2,
    evaluatedSkus: 2,
    totalActualUnits: 190,
    totalExpectedUnits: 210,
    mae: 10,
    wapePct: 9.52,
    biasPct: 10.53,
    withinRangePct: 100,
    warningAccuracyPct: 100,
  },
  comparisons: [
    {
      sku: 'TEE-BLK-S',
      expected: 150,
      low: 80,
      high: 220,
      actualUnits: 140,
      error: 10,
      absError: 10,
      withinRange: true,
      stockoutOccurred: true,
      riskLevel: 'high',
      warningAccurate: true,
    },
    {
      sku: 'HOODIE-GRY-L',
      expected: 60,
      low: 30,
      high: 90,
      actualUnits: 50,
      error: 10,
      absError: 10,
      withinRange: true,
      stockoutOccurred: false,
      riskLevel: 'low',
      warningAccurate: true,
    },
  ],
};

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

    await page.route(/\/api\/actuals\/comparison/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_COMPARISON),
      });
    });

    await page.route(/\/api\/actuals\/sale_1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_COMPARISON),
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

  test('authenticated user can dynamically adjust forecast confidence interval (80%, 90%, 95%)', async ({ page }) => {
    await page.goto('/dashboard');

    // Default 95% shows raw backend low/high (80 / 150 / 220 for TEE-BLK-S)
    await expect(page.locator('text=80').first()).toBeVisible();
    await expect(page.locator('text=220').first()).toBeVisible();

    // Click 80% confidence button (tight band: 150 ± 15% -> 128 / 173)
    await page.locator('[data-testid="confidence-btn-80"]').click();
    await expect(page.locator('text=128').first()).toBeVisible();
    await expect(page.locator('text=173').first()).toBeVisible();

    // Click 90% confidence button (mid band: 150 ± 25% -> 113 / 188)
    await page.locator('[data-testid="confidence-btn-90"]').click();
    await expect(page.locator('text=113').first()).toBeVisible();
    await expect(page.locator('text=188').first()).toBeVisible();

    // Switch back to 95%
    await page.locator('[data-testid="confidence-btn-95"]').click();
    await expect(page.locator('text=80').first()).toBeVisible();
    await expect(page.locator('text=220').first()).toBeVisible();
  });

  test('authenticated user can open supplier restock sheet and trigger direct PO CSV download', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Supplier Restock Sheet modal trigger
    await page.locator('button:has-text("Supplier PO Sheet")').click();

    // Modal should be visible — check the actual header text in the component
    await expect(page.locator('text=Supplier Restock & Purchase Order Preview')).toBeVisible();
    await expect(page.locator('text=Auto-Drafted from forecast')).toBeVisible();
    await expect(page.locator('text=TEE-BLK-S').first()).toBeVisible();
    await expect(page.locator('td:has-text("Apex Garments")').first()).toBeVisible();

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

  test('authenticated user can view and record flash sale actuals on /actuals', async ({ page }) => {
    await page.goto('/actuals');

    await expect(page.locator('h1')).toContainText('Forecast vs Actual Comparison');
    await expect(page.locator('text=Mean Abs Error (MAE)')).toBeVisible();
    await expect(page.locator('text=WAPE Error Rate')).toBeVisible();
    await expect(page.locator('text=TEE-BLK-S').first()).toBeVisible();

    // Click Record / Import Actuals
    await page.locator('button:has-text("Record / Import Actuals")').click();
    await expect(page.locator('text=Record Actual Flash Sale Results')).toBeVisible();

    // Fill in actual units
    const actualInputs = page.locator('input[type="number"]');
    if ((await actualInputs.count()) > 0) {
      await actualInputs.first().fill('140');
    }

    // Submit form
    await page.locator('button:has-text("Save & Calculate Metrics")').click();

    // Modal closes and table displays evaluated comparisons
    await expect(page.locator('text=Record Actual Flash Sale Results')).toBeHidden();
    await expect(page.locator('text=TEE-BLK-S').first()).toBeVisible();
  });

  test('expired session returning 401 triggers session toast banner', async ({ page }) => {
    // Override /api/sales to return 401
    await page.route(/\/api\/sales/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Token expired or invalid', code: 'UNAUTHORIZED' },
        }),
      });
    });

    await page.goto('/dashboard');

    // Should display the session-expired alert banner from AuthContext
    await expect(
      page.locator('text=Your session has expired. Please sign in again.'),
    ).toBeVisible();
  });
});
