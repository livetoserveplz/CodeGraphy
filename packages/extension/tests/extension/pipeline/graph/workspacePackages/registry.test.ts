import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildWorkspacePackageRegistry } from '../../../../../src/extension/pipeline/graph/workspacePackages/registry';

function createWorkspaceRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codegraphy-package-registry-'));
}

function writePackageJson(workspaceRoot: string, relativePath: string, name: string): void {
  const packageJsonPath = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(packageJsonPath), { recursive: true });
  fs.writeFileSync(packageJsonPath, JSON.stringify({ name }), 'utf8');
}

describe('pipeline/graph/workspacePackages/registry', () => {
  it('indexes discovered package manifests by package name', () => {
    const workspaceRoot = createWorkspaceRoot();
    try {
      writePackageJson(workspaceRoot, 'packages/shared/package.json', '@scope/shared');

      expect(
        buildWorkspacePackageRegistry([
          'packages/shared/package.json',
          'packages/shared/src/types.ts',
        ], workspaceRoot),
      ).toEqual(new Map([
        ['@scope/shared', {
          name: '@scope/shared',
          nodeId: 'pkg:workspace:packages/shared',
          rootPath: 'packages/shared',
        }],
      ]));
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('skips missing, malformed, and unnamed package manifests', () => {
    const workspaceRoot = createWorkspaceRoot();
    try {
      fs.mkdirSync(path.join(workspaceRoot, 'packages/malformed'), { recursive: true });
      fs.writeFileSync(path.join(workspaceRoot, 'packages/malformed/package.json'), '{"name":', 'utf8');
      fs.mkdirSync(path.join(workspaceRoot, 'packages/unnamed'), { recursive: true });
      fs.writeFileSync(path.join(workspaceRoot, 'packages/unnamed/package.json'), '{}', 'utf8');

      expect(
        buildWorkspacePackageRegistry([
          'packages/malformed/package.json',
          'packages/missing/package.json',
          'packages/unnamed/package.json',
        ], workspaceRoot),
      ).toEqual(new Map());
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });
});
