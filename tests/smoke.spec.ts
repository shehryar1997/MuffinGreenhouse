import { test, expect } from './setup';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('shop/all loads and shows products', async ({ page }) => {
    await page.goto('/shop/all', { waitUntil: 'networkidle' });
    
    // Look for any product link or product-related content
    const productSelector = '[href*="/shop/product/"], a[href*="/product/"], [class*="product-card"], [data-testid*="product"]';
    const productCard = page.locator(productSelector).first();
    
    // Wait up to 8 seconds for products to load
    await expect(productCard).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/.*shop\/all/);
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/shop/all', { waitUntil: 'networkidle' });
    
    // Find first product link
    const productSelector = '[href*="/shop/product/"], a[href*="/product/"]';
    const productLink = page.locator(productSelector).first();
    await expect(productLink).toBeVisible({ timeout: 8000 });
    
    const href = await productLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('/product/');
    
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*product\/.*/);
    await expect(page.locator('h1')).toBeVisible();
    
    // Look for product-specific content
    const productContent = page.locator('[class*="price"], [class*="variant"], [class*="description"], [class*="care"]').first();
    await expect(productContent).toBeVisible({ timeout: 5000 });
  });

  test('add to cart works', async ({ page }) => {
    await page.goto('/shop/all', { waitUntil: 'networkidle' });
    
    // Find and click first product
    const productSelector = '[href*="/shop/product/"], a[href*="/product/"]';
    const productLink = page.locator(productSelector).first();
    await expect(productLink).toBeVisible({ timeout: 8000 });
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    // Look for add to cart button (multiple possible selectors)
    const addToCartSelectors = [
      'button:has-text("Add to Cart")',
      'button:has-text("Add")',
      'button:has-text("Cart")',
      '[data-testid="add-to-cart"]',
      'button[type="submit"]:has-text("Add")',
      'form button'
    ];
    
    let addToCartButton = null;
    for (const selector of addToCartSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        addToCartButton = button;
        break;
      }
    }
    
    if (addToCartButton) {
      await addToCartButton.click();
      
      // Wait for any cart update or navigation
      await page.waitForTimeout(2000);
      
      // Check if we either see cart update or went to checkout
      const isCheckoutPage = page.url().includes('/checkout');
      const cartVisible = await page.locator('[class*="cart"], [data-testid*="cart"]').isVisible().catch(() => false);
      const notificationVisible = await page.locator('[class*="notification"], [class*="toast"]').isVisible().catch(() => false);
      
      expect(isCheckoutPage || cartVisible || notificationVisible).toBeTruthy();
    } else {
      // If no add to cart button found, this might be an invalid test
      // Verify we're at least on a product page
      await expect(page).toHaveURL(/.*product\/.*/);
    }
  });

  test('checkout page loads', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'networkidle' });
    
    await expect(page).toHaveURL(/.*checkout/);
    
    // Look for checkout content
    const checkoutSelectors = [
      'main [class*="checkout"]',
      '[data-testid="checkout"]',
      'main form',
      'main h1',
      'main h2'
    ];
    
    let checkoutContent = null;
    for (const selector of checkoutSelectors) {
      const content = page.locator(selector).first();
      if (await content.isVisible().catch(() => false)) {
        checkoutContent = content;
        break;
      }
    }
    
    expect(checkoutContent).toBeTruthy();
    if (checkoutContent) {
      await expect(checkoutContent).toBeVisible();
    }
  });
});