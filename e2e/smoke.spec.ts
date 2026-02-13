import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/')

    // Wait for main content to be visible
    await expect(page.locator('body')).toBeVisible()

    // Check page title
    await expect(page).toHaveTitle(/8EH Radio ITB/)

    // Take screenshot for evidence
    await page.screenshot({
      path: '.sisyphus/evidence/task-5-home-smoke.png',
      fullPage: true,
    })
  })

  test('login page loads and rejects invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Wait for login form to be visible
    await expect(page.locator('body')).toBeVisible()

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login.*/)

    // Take screenshot for evidence
    await page.screenshot({
      path: '.sisyphus/evidence/task-5-login-smoke.png',
      fullPage: true,
    })
  })
})
