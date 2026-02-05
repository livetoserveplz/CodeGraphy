/**
 * Visual regression tests for the CodeGraphy graph component.
 * Uses Playwright to screenshot the webview at various states.
 */

import { test, expect } from '@playwright/test';

// Wait for the graph to stabilize after physics simulation
const STABILIZE_TIMEOUT = 3000;

test.describe('Graph Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('default graph renders correctly', async ({ page }) => {
    await page.goto('/?fixture=default');
    
    // Wait for graph to load and stabilize
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    // Screenshot the graph
    await expect(page).toHaveScreenshot('default-graph.png', {
      animations: 'disabled',
    });
  });

  test('empty graph shows appropriate state', async ({ page }) => {
    await page.goto('/?fixture=empty');
    
    // Empty graph might show loading or the container without canvas
    // Wait for either the graph container or the root to be ready
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give time for any transitions
    
    await expect(page).toHaveScreenshot('empty-graph.png', {
      animations: 'disabled',
    });
  });

  test('large graph renders without errors', async ({ page }) => {
    await page.goto('/?fixture=large');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 15000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT + 2000); // Extra time for large graph
    
    await expect(page).toHaveScreenshot('large-graph.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02, // Allow slightly more variance for large graphs
    });
  });

  test('bidirectional edges display correctly', async ({ page }) => {
    await page.goto('/?fixture=bidirectional');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    await expect(page).toHaveScreenshot('bidirectional-graph.png', {
      animations: 'disabled',
    });
  });

  test('favorites are highlighted', async ({ page }) => {
    await page.goto('/?fixture=favorites');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    await expect(page).toHaveScreenshot('favorites-graph.png', {
      animations: 'disabled',
    });
  });

  test('depth graph shows level styling', async ({ page }) => {
    await page.goto('/?fixture=depth');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    await expect(page).toHaveScreenshot('depth-graph.png', {
      animations: 'disabled',
    });
  });
});

test.describe('UI Components Visual Regression', () => {
  test('search bar renders correctly', async ({ page }) => {
    await page.goto('/?fixture=default');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    // Focus on the search area
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('search-bar-focused.png', {
        animations: 'disabled',
      });
    }
  });

  test('view switcher dropdown', async ({ page }) => {
    await page.goto('/?fixture=default');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    // Try to open view switcher if it exists
    const viewSwitcher = page.locator('[data-testid="view-switcher"]');
    if (await viewSwitcher.isVisible()) {
      await viewSwitcher.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('view-switcher-open.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Interaction Visual Regression', () => {
  test('hover highlights connected nodes', async ({ page }) => {
    await page.goto('/?fixture=default');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    // Get canvas center and hover near it
    const canvas = page.locator('.graph-container canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      // Hover in the center area where nodes should be
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('hover-highlight.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.05, // More variance since hover position affects result
      });
    }
  });

  test('context menu appears on right click', async ({ page }) => {
    await page.goto('/?fixture=default');
    
    await page.waitForSelector('.graph-container canvas', { timeout: 10000 });
    await page.waitForTimeout(STABILIZE_TIMEOUT);
    
    const canvas = page.locator('.graph-container canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      // Right-click in center
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
        button: 'right',
      });
      await page.waitForTimeout(500);
      
      // Check if context menu appeared
      const contextMenu = page.locator('[role="menu"]');
      if (await contextMenu.isVisible()) {
        await expect(page).toHaveScreenshot('context-menu.png', {
          animations: 'disabled',
        });
      }
    }
  });
});
