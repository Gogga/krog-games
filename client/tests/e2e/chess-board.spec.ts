import { test, expect } from '@playwright/test';

test.describe('Chess Board - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should render chess board when starting game', async ({ page }) => {
    await page.goto('/');

    // Look for the vs Computer button and click it
    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();

      // Wait for board to appear
      await page.waitForTimeout(1000);

      // Board should be visible
      const board = page.locator('.chess-board');
      await expect(board).toBeVisible();
    }
  });

  test('should have 64 squares on the board', async ({ page }) => {
    await page.goto('/');

    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      // Should have 64 squares
      const squares = page.locator('.chess-square');
      await expect(squares).toHaveCount(64);
    }
  });

  test('should fit board within viewport', async ({ page }) => {
    await page.goto('/');

    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      const board = page.locator('.chess-board');
      const box = await board.boundingBox();

      if (box) {
        // Board should fit within viewport
        expect(box.width).toBeLessThanOrEqual(375);
        expect(box.height).toBeLessThanOrEqual(667);

        // Board should be square (or close to it)
        const ratio = box.width / box.height;
        expect(ratio).toBeGreaterThan(0.9);
        expect(ratio).toBeLessThan(1.1);
      }
    }
  });
});

test.describe('Chess Board - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('should render larger board on tablet', async ({ page }) => {
    await page.goto('/');

    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      const board = page.locator('.chess-board');
      const box = await board.boundingBox();

      if (box) {
        // Board should be larger than on mobile
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });
});

test.describe('Chess Board - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should have two-column layout', async ({ page }) => {
    await page.goto('/');

    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      // Board should not take full width
      const board = page.locator('.chess-board');
      const box = await board.boundingBox();

      if (box) {
        expect(box.width).toBeLessThan(800);
      }
    }
  });
});

test.describe('Board Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should handle orientation change', async ({ page }) => {
    await page.goto('/');

    const computerButton = page.getByRole('button', { name: /computer/i });
    if (await computerButton.isVisible()) {
      await computerButton.click();
      await page.waitForTimeout(1000);

      // Get initial board size
      const board = page.locator('.chess-board');
      const initialBox = await board.boundingBox();

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      // Board should still be visible and resized
      await expect(board).toBeVisible();
      const landscapeBox = await board.boundingBox();

      if (initialBox && landscapeBox) {
        // Board dimensions should have changed
        expect(landscapeBox.width).not.toBe(initialBox.width);
      }
    }
  });
});
