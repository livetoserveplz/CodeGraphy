import { describe, it, expect, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import {
  getGraphViewUriKey,
  getGraphViewLocalResourceRoots,
} from '../../../src/extension/graphView/resourceRoots';

function makeUri(fsPath: string): vscode.Uri {
  return vscode.Uri.file(fsPath);
}

describe('getGraphViewUriKey', () => {
  it('returns the fsPath of a URI', () => {
    const uri = makeUri('/some/path');
    expect(getGraphViewUriKey(uri)).toBe('/some/path');
  });

  it('returns the path property when fsPath is absent', () => {
    const uri = { path: '/virtual/path' } as unknown as vscode.Uri;
    expect(getGraphViewUriKey(uri)).toBe('/virtual/path');
  });

  it('falls back to toString() when fsPath and path are absent', () => {
    const uri = { toString: () => 'fallback-key' } as unknown as vscode.Uri;
    expect(getGraphViewUriKey(uri)).toBe('fallback-key');
  });
});

describe('getGraphViewLocalResourceRoots', () => {
  beforeEach(() => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => undefined,
      configurable: true,
    });
  });

  it('includes the extension URI as a root', () => {
    const extensionUri = makeUri('/extension');
    const roots = getGraphViewLocalResourceRoots(extensionUri, new Map());
    expect(roots.some(root => getGraphViewUriKey(root) === '/extension')).toBe(true);
  });

  it('includes plugin extension URIs as roots', () => {
    const extensionUri = makeUri('/extension');
    const pluginUri = makeUri('/plugin-root');
    const pluginUris = new Map([['plugin-a', pluginUri]]);
    const roots = getGraphViewLocalResourceRoots(extensionUri, pluginUris);
    expect(roots.some(root => getGraphViewUriKey(root) === '/plugin-root')).toBe(true);
  });

  it('includes workspace folder URIs as roots', () => {
    const extensionUri = makeUri('/extension');
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      get: () => [{ uri: makeUri('/workspace'), name: 'workspace', index: 0 }],
      configurable: true,
    });
    const roots = getGraphViewLocalResourceRoots(extensionUri, new Map());
    expect(roots.some(root => getGraphViewUriKey(root) === '/workspace')).toBe(true);
  });

  it('de-duplicates roots with the same URI key', () => {
    const extensionUri = makeUri('/shared');
    const pluginUris = new Map([['plugin-a', makeUri('/shared')]]);
    const roots = getGraphViewLocalResourceRoots(extensionUri, pluginUris);
    const sharedRoots = roots.filter(root => getGraphViewUriKey(root) === '/shared');
    expect(sharedRoots).toHaveLength(1);
  });

  it('returns only the extension root when there are no plugins or workspace folders', () => {
    const extensionUri = makeUri('/extension');
    const roots = getGraphViewLocalResourceRoots(extensionUri, new Map());
    expect(roots).toHaveLength(1);
  });

  it('handles multiple plugin roots without duplicates', () => {
    const extensionUri = makeUri('/extension');
    const pluginUris = new Map([
      ['plugin-a', makeUri('/plugin-a')],
      ['plugin-b', makeUri('/plugin-b')],
    ]);
    const roots = getGraphViewLocalResourceRoots(extensionUri, pluginUris);
    expect(roots).toHaveLength(3);
  });
});
