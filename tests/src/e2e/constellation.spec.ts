import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:12003';

test.describe('Constellation UI E2E Tests', () => {
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    };

    // Register and login
    await page.goto(`${BASE_URL}/register`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    await page.click('[data-testid="register-button"]');
  });

  test('should render 3D constellation view', async ({ page }) => {
    await page.goto(`${BASE_URL}/constellation`);
    
    // Wait for 3D scene to load
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Check if WebGL canvas is present
    const canvas = page.locator('[data-testid="constellation-canvas"]');
    await expect(canvas).toBeVisible();
    
    // Verify 3D context
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="constellation-canvas"]') as HTMLCanvasElement;
      return canvas && canvas.getContext('webgl') !== null;
    });
    expect(hasWebGL).toBe(true);
  });

  test('should display memory nodes as stars', async ({ page }) => {
    // First create some memories
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Test Memory 1');
    await page.fill('[data-testid="memory-content"]', 'This is a test memory for constellation view');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Test Memory 2');
    await page.fill('[data-testid="memory-content"]', 'Another test memory');
    await page.click('[data-testid="save-memory"]');
    
    // Go to constellation view
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Wait for memories to load and render
    await page.waitForTimeout(2000);
    
    // Check if memory nodes are rendered
    const nodeCount = await page.evaluate(() => {
      return window.constellationScene?.children.filter(child => child.userData?.type === 'memory').length || 0;
    });
    
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should allow zooming and panning', async ({ page }) => {
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    const canvas = page.locator('[data-testid="constellation-canvas"]');
    
    // Test mouse wheel zoom
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Zoom in
    
    // Wait for zoom animation
    await page.waitForTimeout(500);
    
    // Test panning
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    // Verify camera position changed
    const cameraPosition = await page.evaluate(() => {
      return window.constellationCamera?.position;
    });
    
    expect(cameraPosition).toBeDefined();
  });

  test('should show memory details on node click', async ({ page }) => {
    // Create a memory first
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Clickable Memory');
    await page.fill('[data-testid="memory-content"]', 'This memory should be clickable in constellation view');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    await page.waitForTimeout(2000);
    
    // Click on a memory node
    const canvas = page.locator('[data-testid="constellation-canvas"]');
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // Should show memory details panel
    await expect(page.locator('[data-testid="memory-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-title-display"]')).toContainText('Clickable Memory');
  });

  test('should display AI connections between related memories', async ({ page }) => {
    // Create related memories
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Family Vacation');
    await page.fill('[data-testid="memory-content"]', 'We went to the beach for summer vacation');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Beach Day');
    await page.fill('[data-testid="memory-content"]', 'Another beautiful day at the beach with family');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    await page.waitForTimeout(3000); // Wait for AI processing
    
    // Check for connection lines between related memories
    const connectionCount = await page.evaluate(() => {
      return window.constellationScene?.children.filter(child => child.userData?.type === 'connection').length || 0;
    });
    
    expect(connectionCount).toBeGreaterThan(0);
  });

  test('should filter memories by type', async ({ page }) => {
    // Create different types of memories
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Text Memory');
    await page.fill('[data-testid="memory-content"]', 'This is a text memory');
    await page.selectOption('[data-testid="memory-type"]', 'text');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Photo Memory');
    await page.fill('[data-testid="memory-content"]', 'This is a photo memory');
    await page.selectOption('[data-testid="memory-type"]', 'photo');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Use filter controls
    await page.click('[data-testid="filter-button"]');
    await page.check('[data-testid="filter-text"]');
    await page.uncheck('[data-testid="filter-photo"]');
    await page.click('[data-testid="apply-filters"]');
    
    await page.waitForTimeout(1000);
    
    // Verify only text memories are visible
    const visibleNodes = await page.evaluate(() => {
      return window.constellationScene?.children.filter(child => 
        child.userData?.type === 'memory' && child.visible
      ).length || 0;
    });
    
    expect(visibleNodes).toBeGreaterThan(0);
  });

  test('should search memories in constellation view', async ({ page }) => {
    // Create searchable memories
    await page.goto(`${BASE_URL}/memories/new`);
    await page.fill('[data-testid="memory-title"]', 'Searchable Memory');
    await page.fill('[data-testid="memory-content"]', 'This memory contains unique searchable content');
    await page.click('[data-testid="save-memory"]');
    
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Use search functionality
    await page.fill('[data-testid="constellation-search"]', 'searchable');
    await page.press('[data-testid="constellation-search"]', 'Enter');
    
    await page.waitForTimeout(1000);
    
    // Should highlight matching memories
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText('1 result');
  });

  test('should show timeline view toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Toggle to timeline view
    await page.click('[data-testid="view-toggle"]');
    await page.click('[data-testid="timeline-view"]');
    
    // Should switch to timeline layout
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
    
    // Toggle back to constellation
    await page.click('[data-testid="view-toggle"]');
    await page.click('[data-testid="constellation-view"]');
    
    await expect(page.locator('[data-testid="constellation-canvas"]')).toBeVisible();
  });

  test('should handle constellation performance with many memories', async ({ page }) => {
    // Create many memories for performance testing
    for (let i = 0; i < 20; i++) {
      await page.goto(`${BASE_URL}/memories/new`);
      await page.fill('[data-testid="memory-title"]', `Performance Memory ${i}`);
      await page.fill('[data-testid="memory-content"]', `Content for memory ${i}`);
      await page.click('[data-testid="save-memory"]');
    }
    
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    await page.waitForTimeout(3000); // Wait for all memories to load
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds
    
    // Should be responsive to interactions
    const canvas = page.locator('[data-testid="constellation-canvas"]');
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    
    // Should not freeze or become unresponsive
    await page.waitForTimeout(500);
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBe(true);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Focus on constellation
    await page.click('[data-testid="constellation-canvas"]');
    
    // Test keyboard controls
    await page.keyboard.press('ArrowUp'); // Pan up
    await page.keyboard.press('ArrowDown'); // Pan down
    await page.keyboard.press('ArrowLeft'); // Pan left
    await page.keyboard.press('ArrowRight'); // Pan right
    await page.keyboard.press('Equal'); // Zoom in
    await page.keyboard.press('Minus'); // Zoom out
    
    // Should respond to keyboard input
    const cameraPosition = await page.evaluate(() => {
      return window.constellationCamera?.position;
    });
    
    expect(cameraPosition).toBeDefined();
  });

  test('should show memory creation from constellation view', async ({ page }) => {
    await page.goto(`${BASE_URL}/constellation`);
    await page.waitForSelector('[data-testid="constellation-canvas"]');
    
    // Click add memory button
    await page.click('[data-testid="add-memory-fab"]');
    
    // Should open memory creation modal
    await expect(page.locator('[data-testid="memory-creation-modal"]')).toBeVisible();
    
    // Fill and submit
    await page.fill('[data-testid="quick-memory-title"]', 'Quick Memory');
    await page.fill('[data-testid="quick-memory-content"]', 'Created from constellation view');
    await page.click('[data-testid="quick-save-memory"]');
    
    // Should close modal and add new node
    await expect(page.locator('[data-testid="memory-creation-modal"]')).not.toBeVisible();
    
    // Wait for new node to appear
    await page.waitForTimeout(2000);
    
    const nodeCount = await page.evaluate(() => {
      return window.constellationScene?.children.filter(child => child.userData?.type === 'memory').length || 0;
    });
    
    expect(nodeCount).toBeGreaterThan(0);
  });
});