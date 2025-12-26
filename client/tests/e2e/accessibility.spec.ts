import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - Home Page', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter out minor issues, focus on critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toContain('KROG');
  });

  test('should have proper language attribute', async ({ page }) => {
    await page.goto('/');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });
});

test.describe('Accessibility - Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    const navButtons = page.locator('.mobile-nav-item');
    const count = await navButtons.count();

    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);

      // Each button should have accessible text
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check if there's a focused element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast on buttons', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('button')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('/');

    // Tab through elements
    const focusableElements: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || '';
      });
      focusableElements.push(focused);
    }

    // Should have multiple focusable elements
    const uniqueElements = new Set(focusableElements);
    expect(uniqueElements.size).toBeGreaterThan(1);
  });

  test('should support Escape to close modals', async ({ page }) => {
    await page.goto('/');

    // Try to open a modal (if available)
    const faqButton = page.getByRole('button', { name: /faq|help|\?/i });
    if (await faqButton.isVisible()) {
      await faqButton.click();
      await page.waitForTimeout(500);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Modal should be closed
      const modal = page.locator('.modal-overlay, .bottom-sheet-overlay');
      const isVisible = await modal.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });
});

test.describe('Accessibility - Touch Targets', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have minimum touch target size (44x44)', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    let passCount = 0;
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Either width or height should be at least 44px
        // Some text buttons may be narrower but taller
        if (box.height >= 44 || box.width >= 44) {
          passCount++;
        }
      }
    }

    // At least 80% of buttons should meet touch target guidelines
    expect(passCount / count).toBeGreaterThan(0.8);
  });
});

test.describe('Accessibility - Images', () => {
  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // All images should have alt attribute (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Accessibility - ARIA', () => {
  test('should have proper ARIA roles on interactive elements', async ({ page }) => {
    await page.goto('/');

    // Buttons should have proper role
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const role = await button.getAttribute('role');

      // Buttons either have implicit button role or explicit role
      if (role) {
        expect(['button', 'tab', 'menuitem', 'link']).toContain(role);
      }
    }
  });
});
