# Testing Setup

This document explains the testing setup for the MGH project.

## Overview

- **Testing Framework**: Playwright
- **Test Type**: Smoke tests (end-to-end critical paths)
- **CI/CD**: GitHub Actions
- **Target Runtime**: Under 2 minutes per test suite

## Test Coverage

The smoke tests cover:

1. **Homepage Load** - Verifies navigation, main content, and footer are visible
2. **Shop/All Page** - Confirms products are displayed on the shop listing page
3. **Product Detail Page** - Tests navigation to product details and content display
4. **Add to Cart** - Validates the add to cart functionality works
5. **Checkout Page** - Ensures checkout page loads properly

## Running Tests Locally

```bash
# Run all smoke tests (will start dev server automatically)
npm run test

# Run tests with browser visible (useful for debugging)
npm run test:headed

# Run with Playwright UI (interactive mode)
npm run test:ui

# Run only smoke tests (same as npm run test)
npm run test:smoke

# Run specific test
npx playwright test --grep "homepage loads"

# Run on specific browser
npx playwright test --project chromium
```

## test Structure

```
tests/
├── setup.ts           # Test utilities and fixtures
└── smoke.spec.ts      # Smoke test suite
```

- **setup.ts**: Custom test fixtures and configurations
- **smoke.spec.ts**: Main smoke test suite covering critical user flows

## CI/CD Configuration

### GitHub Actions Workflow

Located in `.github/workflows/ci.yml`

**Triggers:**
- Pull requests to `main` branch
- Pushes to `main` branch

**Jobs:**
1. **quality-checks**: Runs lint and type-check in parallel
2. **smoke-tests**: Runs e2e tests after quality checks pass

**Optimizations:**
- Parallel quality checks for faster feedback
- Limited to Chromium + WebKit in CI for speed
- 3-minute timeout for test suite
- Browser caching and CI-specific configurations

### Environment Variables

- `CI=true`: Automatically set in GitHub Actions, triggers CI-specific optimizations

## Configuration

### Playwright Config (`playwright.config.ts`)

**CI Optimizations:**
- Reduced browser set (Chromium + WebKit)
- Faster timeouts (30s per test, 2min total)
- List reporter for CI (HTML for local)
- 2 workers in CI for parallelization
- Trace retention on failure for debugging

**Local Development:**
- Full browser set (Chromium + Firefox + WebKit)
- HTML reporter with screenshots and videos
- Longer timeouts for debugging

## Debugging

### Failed Tests

When tests fail in CI:
1. Download the `playwright-report` artifact
2. Open `index.html` in the report folder
3. View screenshots, videos, and trace files

### Local Debugging

```bash
# Run with browser visible
npm run test:headed

# Run with Playwright UI (step-through debugging)
npm run test:ui

# Run with debug mode
npx playwright test --debug

# Run specific failing test
npx playwright test --grep "test name"
```

## Best Practices

1. **Keep tests fast**: Target under 2 minutes total runtime
2. **Focus on critical paths**: Test only essential user flows
3. **Use resilient selectors**: Prefer semantic selectors over implementation details
4. **Handle async properly**: Use appropriate wait strategies
5. **Maintain test isolation**: Each test should work independently

## Adding New Tests

When adding new smoke tests:

1. Add to `tests/smoke.spec.ts` if it's a critical path test
2. Use the custom fixtures from `tests/setup.ts`
3. Follow the existing pattern for page interactions
4. Test happy path scenarios only (smoke tests, not comprehensive tests)
5. Keep timeouts reasonable for CI

## Troubleshooting

### Common Issues

1. **Test fails intermittently**: Increase timeout or add better wait conditions
2. **Selector not found**: Check if the UI has changed, update selectors
3. **Tests time out**: Verify app performance, adjust timeouts if needed
4. **CI failures**: Check CI logs, download test artifacts for debugging

### Resource Limits

- CI runs in 2-minute timeout window
- Use 2 workers max in CI to avoid resource contention
- Limit to essential browsers for speed

## Future Improvements

- Add accessibility tests to the smoke suite
- Add visual regression tests for critical pages
- Add API testing for critical endpoints
- Expand test coverage based on user feedback and bug reports