import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * Tests: Login, Logout, Registration, Session Management
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*prijava/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/prijava');
    
    // Check form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/prijava');
    
    // Click submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show error messages
    await expect(page.locator('text=/email.*obavezan/i')).toBeVisible({ timeout: 2000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/prijava');
    
    // Fill login form
    await page.fill('input[name="email"]', 'ucenik1@osnovci.rs');
    await page.fill('input[type="password"]', 'Test123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should see dashboard content
    await expect(page.locator('text=/dashboard|domaći|raspored/i')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/prijava');
    
    // Fill with wrong password
    await page.fill('input[name="email"]', 'ucenik1@osnovci.rs');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/pogrešna|neispravna|nije ispravna/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to registration', async ({ page }) => {
    await page.goto('/prijava');
    
    // Click registration link
    await page.click('text=/registruj|napravi nalog/i');
    
    // Should navigate to registration
    await expect(page).toHaveURL(/.*registracija/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/prijava');
    await page.fill('input[name="email"]', 'ucenik1@osnovci.rs');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Find and click logout button
    await page.click('[aria-label*="odjava" i], text=/odjavi/i');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*prijava/, { timeout: 5000 });
    
    // Should not be able to access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*prijava/);
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.goto('/prijava');
    await page.fill('input[name="email"]', 'ucenik1@osnovci.rs');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=/dashboard|domaći/i')).toBeVisible();
  });
});

test.describe('Account Lockout', () => {
  test('should lock account after 5 failed attempts', async ({ page }) => {
    await page.goto('/prijava');
    
    // Try 5 times with wrong password
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', 'test.lockout@osnovci.rs');
      await page.fill('input[type="password"]', `WrongPassword${i}!`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000); // Wait for error message
    }
    
    // 6th attempt should show lockout message
    await page.fill('input[name="email"]', 'test.lockout@osnovci.rs');
    await page.fill('input[type="password"]', 'CorrectPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show lockout error
    await expect(page.locator('text=/zaključan|locked|15 min/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Registration', () => {
  test('should show registration form', async ({ page }) => {
    await page.goto('/registracija');
    
    // Check form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('select[name="role"], input[name="role"]')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/registracija');
    
    await page.fill('input[name="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', 'weak'); // Too weak
    await page.click('button[type="submit"]');
    
    // Should show password requirements error
    await expect(page.locator('text=/lozinka.*najmanje|minimum.*karaktera/i')).toBeVisible();
  });
});
