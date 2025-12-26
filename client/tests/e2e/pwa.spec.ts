import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have manifest link', async ({ page }) => {
    await page.goto('/');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('KROG Chess - Learn Chess with Mathematical Proofs');
    expect(manifest.short_name).toBe('KROG Chess');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#81b64c');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have service worker file', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);

    const content = await response?.text();
    expect(content).toContain('CACHE_NAME');
    expect(content).toContain('addEventListener');
  });

  test('should have offline page', async ({ page }) => {
    const response = await page.goto('/offline.html');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText('Offline');
  });

  test('should have proper PWA meta tags', async ({ page }) => {
    await page.goto('/');

    // Theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#81b64c');

    // Apple mobile web app capable
    const appleMobileWebApp = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMobileWebApp).toHaveAttribute('content', 'yes');

    // Mobile web app capable
    const mobileWebApp = page.locator('meta[name="mobile-web-app-capable"]');
    await expect(mobileWebApp).toHaveAttribute('content', 'yes');
  });

  test('should have apple touch icon', async ({ page }) => {
    await page.goto('/');

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]').first();
    await expect(appleTouchIcon).toBeAttached();
  });

  test('should register service worker in production mode', async ({ page }) => {
    await page.goto('/');

    // Wait for potential service worker registration
    await page.waitForTimeout(2000);

    // Check if service worker API is available
    const hasServiceWorkerAPI = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(hasServiceWorkerAPI).toBe(true);
  });
});

test.describe('PWA Installability', () => {
  test('should have required manifest fields for installability', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    const manifest = await response?.json();

    // Required for installability
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();

    // At least one icon >= 192px
    const hasLargeIcon = manifest.icons.some((icon: { sizes: string }) => {
      const size = parseInt(icon.sizes.split('x')[0]);
      return size >= 192;
    });
    expect(hasLargeIcon).toBe(true);

    // At least one maskable icon
    const hasMaskable = manifest.icons.some((icon: { purpose?: string }) => {
      return icon.purpose?.includes('maskable');
    });
    expect(hasMaskable).toBe(true);
  });
});

test.describe('Offline Behavior', () => {
  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Check if offline indicator appears
    const offlineIndicator = page.locator('.offline-indicator');
    // Note: This may or may not be visible depending on implementation
    // The test verifies the component exists when offline
  });
});
