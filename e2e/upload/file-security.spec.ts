import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * E2E Tests - File Upload Security
 * Tests: File type validation, size limits, malicious files
 */

// Helper function to create test files
function createTestFile(filename: string, content: string = 'test content'): string {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper function to login
async function login(page: any) {
  await page.goto('/prijava');
  await page.fill('input[name="email"]', 'ucenik1@osnovci.rs');
  await page.fill('input[type="password"]', 'Test123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('File Upload Security', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/domaci');
  });

  test('should accept valid image files', async ({ page }) => {
    // Create a small image file (1x1 PNG)
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const imagePath = path.join(os.tmpdir(), 'test-image.png');
    fs.writeFileSync(imagePath, pngData);

    // Open homework and try to upload
    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(imagePath);
      
      // Should show success or preview
      await expect(page.locator('text=/uspešno|uploaded|preview/i')).toBeVisible({ timeout: 5000 });
    }

    // Cleanup
    fs.unlinkSync(imagePath);
  });

  test('should reject executable files', async ({ page }) => {
    const exeFile = createTestFile('malicious.exe', 'MZ\x90\x00');

    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(exeFile);
      
      // Should show error
      await expect(page.locator('text=/nije dozvoljen|not allowed|invalid file type/i')).toBeVisible({ timeout: 5000 });
    }

    // Cleanup
    fs.unlinkSync(exeFile);
  });

  test('should reject files that are too large', async ({ page }) => {
    // Create a large file (> 10MB if that's the limit)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const largeFile = createTestFile('large-file.jpg', largeContent);

    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(largeFile);
      
      // Should show size error
      await expect(page.locator('text=/prevelika|too large|size limit/i')).toBeVisible({ timeout: 5000 });
    }

    // Cleanup
    fs.unlinkSync(largeFile);
  });

  test('should reject script files', async ({ page }) => {
    const scriptFile = createTestFile('script.js', 'alert("XSS")');

    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(scriptFile);
      
      // Should reject
      await expect(page.locator('text=/nije dozvoljen|not allowed|invalid/i')).toBeVisible({ timeout: 5000 });
    }

    // Cleanup
    fs.unlinkSync(scriptFile);
  });

  test('should sanitize filenames', async ({ page }) => {
    // File with dangerous characters in name
    const dangerousFile = createTestFile('../../../etc/passwd.txt', 'content');

    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(dangerousFile);
      
      // Should either reject or sanitize the filename
      await page.waitForTimeout(2000);
      
      // Check that no path traversal occurred
      const uploadedName = await page.locator('[data-filename], .filename').first().textContent();
      expect(uploadedName).not.toContain('../');
    }

    // Cleanup
    fs.unlinkSync(dangerousFile);
  });

  test('should compress large images', async ({ page }) => {
    // Create a larger valid image
    const largeImagePath = path.join(os.tmpdir(), 'large-test.png');
    
    // Create a simple but larger PNG (this is still small, but demonstrates the concept)
    const largeImageData = Buffer.alloc(2 * 1024 * 1024, 0xFF); // 2MB of data
    fs.writeFileSync(largeImagePath, largeImageData);

    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible()) {
      await uploadInput.setInputFiles(largeImagePath);
      
      // Should show compression message
      await expect(page.locator('text=/kompresija|compressing|optimizing/i')).toBeVisible({ timeout: 5000 });
    }

    // Cleanup
    fs.unlinkSync(largeImagePath);
  });
});

test.describe('Camera Upload', () => {
  test('should handle camera permission denial gracefully', async ({ page, context }) => {
    await login(page);
    await page.goto('/dashboard/domaci');
    
    // Deny camera permissions
    await context.grantPermissions([], { origin: 'http://localhost:3000' });
    
    // Try to open camera
    const cameraButton = page.locator('button:has-text("Kamera"), button[aria-label*="kamera" i]').first();
    
    if (await cameraButton.isVisible()) {
      await cameraButton.click();
      
      // Should show permission error
      await expect(page.locator('text=/dozvola|permission|camera denied/i')).toBeVisible({ timeout: 5000 });
      
      // Should show Error Boundary fallback (not blank screen)
      await expect(page.locator('text=/greška|error/i')).toBeVisible();
    }
  });

  test('should show camera UI when permission granted', async ({ page, context }) => {
    await login(page);
    await page.goto('/dashboard/domaci');
    
    // Grant camera permissions
    await context.grantPermissions(['camera'], { origin: 'http://localhost:3000' });
    
    const cameraButton = page.locator('button:has-text("Kamera"), button[aria-label*="kamera" i]').first();
    
    if (await cameraButton.isVisible()) {
      await cameraButton.click();
      
      // Should show camera interface
      await expect(page.locator('video, canvas, [data-camera]')).toBeVisible({ timeout: 5000 });
    }
  });
});
