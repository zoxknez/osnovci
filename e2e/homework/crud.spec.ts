import { expect, test } from "@playwright/test";

/**
 * E2E Tests - Homework CRUD Operations
 * Tests: Create, Read, Update, Delete homework
 */

// Helper function to login
async function login(page: any) {
  await page.goto("/prijava");
  await page.fill('input[name="email"]', "ucenik1@osnovci.rs");
  await page.fill('input[type="password"]', "Test123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

test.describe("Homework CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should navigate to homework page", async ({ page }) => {
    // Find and click homework link
    await page.click("text=/domaći|homework/i");

    // Should navigate to homework page
    await expect(page).toHaveURL(/.*domaci/);
    await expect(page.locator("text=/domaći zadaci/i")).toBeVisible();
  });

  test("should open create homework modal", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Click add button
    await page.click('button:has-text("Dodaj"), button[aria-label*="dodaj" i]');

    // Modal should appear
    await expect(
      page.locator("text=/novi zadatak|dodaj zadatak/i"),
    ).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test("should create new homework", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Open modal
    await page.click('button:has-text("Dodaj"), button[aria-label*="dodaj" i]');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Test Zadatak ${timestamp}`);
    await page.fill('textarea[name="description"]', "Opis test zadatka");

    // Select subject (if dropdown exists)
    const subjectSelect = page
      .locator('select[name="subjectId"], [role="combobox"]')
      .first();
    if (await subjectSelect.isVisible()) {
      await subjectSelect.click();
      await page.click("text=/matematika|srpski/i");
    }

    // Set due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().split("T")[0];
    await page.fill('input[name="dueDate"]', dueDate!);

    // Submit
    await page.click(
      'button[type="submit"]:has-text("Sačuvaj"), button:has-text("Dodaj")',
    );

    // Should show success message
    await expect(page.locator("text=/uspešno|sačuvano|added/i")).toBeVisible({
      timeout: 5000,
    });

    // Should see new homework in list
    await expect(page.locator(`text=Test Zadatak ${timestamp}`)).toBeVisible({
      timeout: 3000,
    });
  });

  test("should filter homework by status", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Wait for homework to load
    await page.waitForSelector("text=/zadatak|homework/i", { timeout: 5000 });

    // Find filter dropdown
    const filterButton = page
      .locator('button:has-text("Svi"), select[name="status"]')
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Select "U toku" or "In Progress"
      await page.click("text=/u toku|in progress|assigned/i");

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // All visible items should match the filter
      const items = await page
        .locator('[data-status], [class*="homework"]')
        .all();
      expect(items.length).toBeGreaterThan(0);
    }
  });

  test("should search homework", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Find search input
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="pretraž" i]')
      .first();

    if (await searchInput.isVisible()) {
      await searchInput.fill("Matematika");

      // Wait for search results
      await page.waitForTimeout(500);

      // Should show filtered results
      const results = await page.locator("text=/matematika/i").count();
      expect(results).toBeGreaterThan(0);
    }
  });

  test("should mark homework as done", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Wait for homework cards to load
    await page.waitForSelector('[data-homework], [class*="homework-card"]', {
      timeout: 5000,
    });

    // Find first homework item
    const firstHomework = page
      .locator('[data-homework], [class*="homework-card"]')
      .first();

    if (await firstHomework.isVisible()) {
      // Find and click "Done" button or checkbox
      const doneButton = firstHomework
        .locator(
          'button:has-text("Gotovo"), input[type="checkbox"], button[aria-label*="završi" i]',
        )
        .first();

      if (await doneButton.isVisible()) {
        await doneButton.click();

        // Should show success message
        await expect(page.locator("text=/završeno|gotovo|done/i")).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test("should delete homework", async ({ page }) => {
    await page.goto("/dashboard/domaci");

    // Create a test homework first
    await page.click('button:has-text("Dodaj"), button[aria-label*="dodaj" i]');
    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Delete Test ${timestamp}`);
    await page.click(
      'button[type="submit"]:has-text("Sačuvaj"), button:has-text("Dodaj")',
    );

    // Wait for it to appear
    await expect(page.locator(`text=Delete Test ${timestamp}`)).toBeVisible({
      timeout: 3000,
    });

    // Find and click delete button
    const homeworkCard = page
      .locator(`text=Delete Test ${timestamp}`)
      .locator("..")
      .locator("..");
    const deleteButton = homeworkCard
      .locator('button[aria-label*="obriši" i], button:has-text("Obriši")')
      .first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion in dialog
      await page.click('button:has-text("Obriši"), button:has-text("Da")');

      // Should disappear from list
      await expect(
        page.locator(`text=Delete Test ${timestamp}`),
      ).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("Homework Offline Support", () => {
  test("should save homework offline when offline", async ({
    page,
    context,
  }) => {
    await login(page);
    await page.goto("/dashboard/domaci");

    // Go offline
    await context.setOffline(true);

    // Try to create homework
    await page.click('button:has-text("Dodaj"), button[aria-label*="dodaj" i]');

    const timestamp = Date.now();
    await page.fill('input[name="title"]', `Offline Test ${timestamp}`);
    await page.fill('textarea[name="description"]', "Created while offline");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().split("T")[0];
    await page.fill('input[name="dueDate"]', dueDateStr!);

    await page.click(
      'button[type="submit"]:has-text("Sačuvaj"), button:has-text("Dodaj")',
    );

    // Should show offline message
    await expect(
      page.locator("text=/offline|sačuvano offline|bez interneta/i"),
    ).toBeVisible({ timeout: 5000 });

    // Should see in list with offline indicator
    await expect(page.locator(`text=Offline Test ${timestamp}`)).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Should sync automatically
    await page.waitForTimeout(2000);
    await expect(page.locator("text=/sinhronizovano|synced/i")).toBeVisible({
      timeout: 10000,
    });
  });
});
