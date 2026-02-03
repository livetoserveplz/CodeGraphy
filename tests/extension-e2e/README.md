# Extension E2E Tests

End-to-end tests that run inside a real VS Code instance using [@vscode/test-electron](https://github.com/microsoft/vscode-test).

> **Note:** These tests run **locally only** for now. CI runs are disabled until xvfb/DBus issues are resolved.

## Overview

These tests verify:
- Extension activation
- Command registration  
- Webview functionality
- Configuration handling

## Running Tests

```bash
# Build extension and run E2E tests
npm run test:e2e
```

The test runner will:
1. Download VS Code (if needed)
2. Install the extension in development mode
3. Open a sample workspace
4. Run Mocha tests inside VS Code

## Test Structure

```
tests/extension-e2e/
├── runTests.ts          # Test launcher (downloads VS Code, starts tests)
├── tsconfig.json        # TypeScript config for tests
└── suite/
    ├── index.ts         # Mocha test runner setup
    └── extension.test.ts # Actual test cases
```

## Writing Tests

Tests use Mocha's BDD interface (`suite`, `test`, `suiteSetup`, etc.):

```typescript
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('My Test Suite', () => {
  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('joesobo.codegraphy');
    assert.ok(ext?.isActive);
  });
});
```

## CI

Tests run in CI with `xvfb-run` to provide a virtual display on Linux:

```yaml
- run: xvfb-run -a npm run test:e2e
  env:
    DISPLAY: ':99.0'
```

## Notes

- Tests have a 60-second timeout by default
- Other extensions are disabled during tests (`--disable-extensions`)
- Tests use the `examples/ts-plugin` workspace as a sample project
