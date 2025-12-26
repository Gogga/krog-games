import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation - In Game', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show mobile nav when in a game', async ({ page }) => {
    await page.goto('/');

    // Start a game vs computer to get mobile nav
    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      // Mobile nav should be visible in game view
      const mobileNav = page.locator('.mobile-nav');
      await expect(mobileNav).toBeVisible({ timeout: 5000 });

      // Should have 5 nav items
      const navItems = page.locator('.mobile-nav-item');
      await expect(navItems).toHaveCount(5);
    }
  });

  test('should navigate between tabs in game', async ({ page }) => {
    await page.goto('/');

    // Start a game vs computer
    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      // Click Daily tab
      const dailyTab = page.locator('.mobile-nav-item').filter({ hasText: 'Daily' });
      if (await dailyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dailyTab.click();
        await expect(page.locator('.mobile-nav-item.active')).toContainText('Daily');
      }
    }
  });

  test('should hide mobile nav on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    // Mobile nav should not be visible on desktop
    const mobileNav = page.locator('.mobile-nav');
    // Either not in DOM or hidden by CSS
    const isVisible = await mobileNav.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('should have proper touch targets in game (minimum 44px)', async ({ page }) => {
    await page.goto('/');

    // Start a game vs computer
    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      const navItems = page.locator('.mobile-nav-item');
      const count = await navItems.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const item = navItems.nth(i);
          const box = await item.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should not have horizontal scroll', async ({ page }) => {
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('should have single column layout on mobile', async ({ page }) => {
    await page.goto('/');

    // Main container should be full width
    const container = page.locator('.app-container, .lobby-container').first();
    const box = await container.boundingBox();

    expect(box?.width).toBeLessThanOrEqual(375);
  });
});
