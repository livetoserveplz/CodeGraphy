/**
 * Extension E2E test suite runner.
 * Uses Mocha to run tests inside VS Code.
 */

import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 60000, // 60s timeout for extension tests
  });

  const testsRoot = path.resolve(__dirname, '.');

  // Find all test files
  const files = await glob('**/*.test.js', { cwd: testsRoot });

  // Add files to the test suite
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  // Run the mocha test
  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
