# Visual Regression Tests

This directory contains Playwright-based visual regression tests for the CodeGraphy webview.

> **Note:** These tests run **locally only** for now. CI runs are disabled until cross-platform baselines are generated.

## Overview

Visual regression tests capture screenshots of the graph at various states and compare them against baseline images. This catches rendering bugs, layout shifts, and unexpected visual changes.

## Running Tests

```bash
# Run visual tests (compares against baselines)
npm run test:visual

# Update baseline snapshots
npm run test:visual:update

# Run the test server manually (for debugging)
npm run visual:serve
```

## Test Structure

- `graph.spec.ts` - Main visual regression tests
- `fixtures/` - Test data fixtures for different graph states
- `mocks/` - Mock VSCode API for running outside VSCode
- `graph.spec.ts-snapshots/` - Baseline screenshots (committed to git)

## Fixtures

Each fixture represents a specific graph state:

| Fixture | Description |
|---------|-------------|
| `default` | Small typical project structure |
| `empty` | Empty graph with no nodes |
| `large` | 50 nodes for stress testing |
| `bidirectional` | Combined bidirectional edges |
| `favorites` | Nodes marked as favorites |
| `depth` | Depth graph view with levels |

## Adding New Tests

1. Add a new fixture in `fixtures/index.ts` if needed
2. Add a test case in `graph.spec.ts`
3. Run `npm run test:visual:update` to generate baseline
4. Commit the new baseline snapshot

## Debugging

- Open `http://localhost:5173/?fixture=<name>` to view a fixture manually
- Use `?theme=light` to test light theme
- Check `playwright-report/` after test runs for detailed reports

## CI Integration

Visual tests run in CI and fail if screenshots differ from baselines beyond the configured threshold (1% pixel difference by default).
