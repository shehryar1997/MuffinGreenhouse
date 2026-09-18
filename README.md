# MGH - My Grow House

A Next.js e-commerce application for a plant nursery and garden center.

## Development

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

### Testing

This project includes smoke tests and CI/CD setup:

#### Smoke Tests
- Playwright-based end-to-end tests
- Tests critical user flows: homepage, shop, product details, cart, checkout
- Optimized for speed (target: under 2 minutes)

#### Running Tests

```bash
# Run all smoke tests
npm run test

# Run tests in headed mode (useful for debugging)
npm run test:headed

# Run test UI
npm run test:ui

# Run only smoke tests
npm run test:smoke

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### CI/CD

- GitHub Actions workflow runs on PR to main and push to main
- Includes: lint, type-check, and smoke tests
- Optimized for speed with parallel jobs and browser limits
- Test reports uploaded as artifacts for debugging

## Project Structure

See the project map section for detailed file relationships.