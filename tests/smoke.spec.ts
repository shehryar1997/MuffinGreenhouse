import type { Page } from '@playwright/test';
import { test, expect } from './setup';

// Must match CART_STORAGE_KEY in components/providers/cart-provider.tsx.
const CART_STORAGE_KEY = 'muffin_cart_v1';

// Product links as rendered by <ProductCard> etc: /shop/product/<slug>.
const PRODUCT_LINK = 'a[href^="/shop/product/"]';

// Shown by /shop/all when the catalog has no products at all (see shop-all-client.tsx).
const EMPTY_CATALOG_TEXT = 'New plants are on their way.';
const EMPTY_CATALOG_REASON = 'Catalog is empty, so there is no product to buy. Add a product to run this test.';

/**
 * Unique product hrefs on /shop/all (a card can render several links to the
 * same product). Empty when the shop has no products yet.
 */
async function listProductHrefs(page: Page, max = 6): Promise<string[]> {
  await page.goto('/shop/all', { waitUntil: 'domcontentloaded' });
  // Web-first assertion: auto-waits for either the catalog or the empty-shop message.
  await expect(
    page.locator(PRODUCT_LINK).first().or(page.getByText(EMPTY_CATALOG_TEXT)),
  ).toBeVisible({ timeout: 15000 });
  const hrefs = await page.locator(PRODUCT_LINK).evaluateAll((els) =>
    els.map((el) => el.getAttribute('href') ?? ''),
  );
  return [...new Set(hrefs.filter(Boolean))].slice(0, max);
}

/**
 * Open the first product that can actually be bought. The first card in the
 * catalog may be out of stock (button reads "Out of Stock" and is disabled),
 * so don't assume it. Returns null when the catalog is empty.
 */
async function openInStockProduct(page: Page) {
  const hrefs = await listProductHrefs(page);
  if (hrefs.length === 0) return null;
  for (const href of hrefs) {
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    const addButton = page.getByRole('button', { name: 'Add to Cart' });
    if (await addButton.isEnabled({ timeout: 3000 }).catch(() => false)) {
      return addButton;
    }
  }
  throw new Error(`No in-stock product found among: ${hrefs.join(', ')}`);
}

async function cartItemCount(page: Page): Promise<number> {
  return page.evaluate((key) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed?.items) ? parsed.items.length : 0;
    } catch {
      return 0;
    }
  }, CART_STORAGE_KEY);
}

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('shop/all loads and shows products', async ({ page }) => {
    await page.goto('/shop/all', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/shop\/all/);
    // Products when the catalog has any, the "on their way" message when it is empty.
    await expect(
      page.locator(PRODUCT_LINK).first().or(page.getByText(EMPTY_CATALOG_TEXT)),
    ).toBeVisible({ timeout: 15000 });
  });

  test('product detail page loads', async ({ page }) => {
    const [href] = await listProductHrefs(page, 1);
    test.skip(!href, EMPTY_CATALOG_REASON);
    expect(href).toContain('/product/');

    await page.goto(href, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/product\//);
    await expect(page.locator('h1').first()).toBeVisible();
    // Either state proves the purchase panel rendered.
    await expect(page.getByRole('button', { name: /^(Add to Cart|Out of Stock)$/ })).toBeVisible();
  });

  test('add to cart works', async ({ page }) => {
    const addButton = await openInStockProduct(page);
    test.skip(!addButton, EMPTY_CATALOG_REASON);

    await addButton!.click();

    // The cart drawer slides open as the confirmation, and the item really landed in the persisted cart.
    await expect(page.getByRole('dialog', { name: /cart/i })).toBeVisible();
    await expect.poll(() => cartItemCount(page)).toBeGreaterThan(0);
  });

  test('checkout page loads', async ({ page }) => {
    // /checkout redirects to /shop/all when the cart is empty, so put
    // something in the cart first. The cart is restored from localStorage on
    // the full page load below.
    const addButton = await openInStockProduct(page);
    test.skip(!addButton, EMPTY_CATALOG_REASON);
    await addButton!.click();
    await expect.poll(() => cartItemCount(page)).toBeGreaterThan(0);

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/checkout/);
    await expect(page.getByRole('heading', { name: 'Delivery Details' })).toBeVisible({ timeout: 15000 });
  });
});
