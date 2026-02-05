/**
 * Extension E2E test runner.
 * Downloads VS Code, installs the extension, and runs tests.
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // Path to the extension source (root of the repo)
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // Path to the test runner script
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Path to a sample workspace for testing
    const testWorkspacePath = path.resolve(__dirname, '../../examples/ts-plugin');

    // Download VS Code, unzip it, and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspacePath,
        '--disable-extensions', // Disable other extensions to isolate tests
      ],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
