import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveMonorepoImportMapTargetId } from '../../../../../src/extension/pipeline/graph/monorepoImportMap/resolve';

const tempRoots = new Set<string>();

function createWorkspaceRoot(): string {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraphy-monorepo-map-'));
  tempRoots.add(workspaceRoot);
  return workspaceRoot;
}

function writeWorkspaceFile(workspaceRoot: string, relativePath: string, contents = ''): string {
  const absolutePath = path.join(workspaceRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, 'utf8');
  return absolutePath;
}

afterEach(() => {
  for (const workspaceRoot of tempRoots) {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
  tempRoots.clear();
});

describe('pipeline/graph/monorepoImportMap/resolve', () => {
  it('maps an exact bare import specifier to a discovered workspace file', () => {
    const workspaceRoot = createWorkspaceRoot();
    const fileConnections = new Map([['packages/plugin-api/src/index.ts', []]]);

    expect(
      resolveMonorepoImportMapTargetId(
        '@codegraphy-vscode/plugin-api',
        {
          '@codegraphy-vscode/plugin-api': 'packages/plugin-api/src/index.ts',
        },
        fileConnections,
        workspaceRoot,
      ),
    ).toBe('packages/plugin-api/src/index.ts');
  });

  it('maps a package root through package.json type exports', () => {
    const workspaceRoot = createWorkspaceRoot();
    writeWorkspaceFile(
      workspaceRoot,
      'packages/plugin-api/package.json',
      JSON.stringify({
        name: '@codegraphy-vscode/plugin-api',
        exports: {
          '.': {
            types: './src/index.ts',
          },
        },
      }),
    );
    writeWorkspaceFile(workspaceRoot, 'packages/plugin-api/src/index.ts', 'export interface Plugin {}\n');
    const fileConnections = new Map([['packages/plugin-api/src/index.ts', []]]);

    expect(
      resolveMonorepoImportMapTargetId(
        '@codegraphy-vscode/plugin-api',
        {
          '@codegraphy-vscode/plugin-api': 'packages/plugin-api',
        },
        fileConnections,
        workspaceRoot,
      ),
    ).toBe('packages/plugin-api/src/index.ts');
  });

  it('maps package subpaths through package.json type exports', () => {
    const workspaceRoot = createWorkspaceRoot();
    writeWorkspaceFile(
      workspaceRoot,
      'packages/plugin-api/package.json',
      JSON.stringify({
        name: '@codegraphy-vscode/plugin-api',
        exports: {
          './events': {
            types: './src/events.ts',
          },
        },
      }),
    );
    writeWorkspaceFile(workspaceRoot, 'packages/plugin-api/src/events.ts', 'export interface Event {}\n');
    const fileConnections = new Map([['packages/plugin-api/src/events.ts', []]]);

    expect(
      resolveMonorepoImportMapTargetId(
        '@codegraphy-vscode/plugin-api/events',
        {
          '@codegraphy-vscode/plugin-api': 'packages/plugin-api',
        },
        fileConnections,
        workspaceRoot,
      ),
    ).toBe('packages/plugin-api/src/events.ts');
  });

  it('uses the longest matching map entry for package subpaths', () => {
    const workspaceRoot = createWorkspaceRoot();
    const fileConnections = new Map([
      ['packages/plugin-api/src/index.ts', []],
      ['packages/plugin-api/src/events.ts', []],
    ]);

    expect(
      resolveMonorepoImportMapTargetId(
        '@codegraphy-vscode/plugin-api/events',
        {
          '@codegraphy-vscode/plugin-api': 'packages/plugin-api/src',
          '@codegraphy-vscode/plugin-api/events': 'packages/plugin-api/src/events.ts',
        },
        fileConnections,
        workspaceRoot,
      ),
    ).toBe('packages/plugin-api/src/events.ts');
  });

  it('returns null for unmapped specifiers and mapped files outside the workspace graph', () => {
    const workspaceRoot = createWorkspaceRoot();
    const externalRoot = createWorkspaceRoot();
    writeWorkspaceFile(externalRoot, 'plugin-api/src/index.ts', 'export interface Plugin {}\n');

    expect(
      resolveMonorepoImportMapTargetId(
        'react',
        {
          '@codegraphy-vscode/plugin-api': 'packages/plugin-api/src/index.ts',
        },
        new Map(),
        workspaceRoot,
      ),
    ).toBeNull();
    expect(
      resolveMonorepoImportMapTargetId(
        '@codegraphy-vscode/plugin-api',
        {
          '@codegraphy-vscode/plugin-api': path.join(externalRoot, 'plugin-api/src/index.ts'),
        },
        new Map([['packages/plugin-api/src/index.ts', []]]),
        workspaceRoot,
      ),
    ).toBeNull();
  });
});
