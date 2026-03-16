import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import {
  normalizeGraphViewExtensionUri,
  resolveGraphViewAssetPath,
} from '../../../src/extension/graphView/resources';

function makeUri(fsPath: string): vscode.Uri {
  return vscode.Uri.file(fsPath);
}

/** A minimal webview mock that uses the path-based fallback path in resolveGraphViewAssetPath. */
function makePathFallbackWebview(): vscode.Webview {
  return {
    asWebviewUri: (uri: vscode.Uri) => {
      // Return an object where toString() returns '[object Object]'
      // but path is populated — exercises the pathLike fallback.
      const candidate = uri as unknown as { path?: string; fsPath?: string };
      return {
        toString: () => '[object Object]',
        path: candidate.path ?? candidate.fsPath,
      };
    },
  } as unknown as vscode.Webview;
}

describe('normalizeGraphViewExtensionUri', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeGraphViewExtensionUri(undefined)).toBeUndefined();
  });

  it('converts a string path to a vscode.Uri', () => {
    const result = normalizeGraphViewExtensionUri('/some/plugin');
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('returns the same vscode.Uri object when given a Uri', () => {
    const uri = makeUri('/some/plugin');
    const result = normalizeGraphViewExtensionUri(uri);
    expect(result).toBe(uri);
  });
});

describe('resolveGraphViewAssetPath', () => {
  const extensionUri = makeUri('/extension');
  const pluginExtensionUris = new Map([['plugin-a', makeUri('/plugin-a')]]);

  it('returns absolute URIs unchanged', () => {
    const result = resolveGraphViewAssetPath({
      assetPath: 'https://example.com/image.png',
      extensionUri,
      pluginExtensionUris,
    });
    expect(result).toBe('https://example.com/image.png');
  });

  it('resolves relative paths against the extension root when no pluginId is given', () => {
    const webview = makePathFallbackWebview();
    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      webview,
    });
    expect(result).toContain('/extension');
    expect(result).toContain('icon.png');
  });

  it('resolves relative paths against the plugin root when pluginId is known', () => {
    const webview = makePathFallbackWebview();
    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      pluginId: 'plugin-a',
      webview,
    });
    expect(result).toContain('/plugin-a');
  });

  it('resolves relative paths against the extension root when pluginId is unknown', () => {
    const webview = makePathFallbackWebview();
    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      pluginId: 'unknown-plugin',
      webview,
    });
    expect(result).toContain('/extension');
  });

  it('uses the webview to convert URIs when the webview returns a string from asWebviewUri', () => {
    const mockWebview = {
      asWebviewUri: (_uri: unknown) => 'vscode-webview://host/some/path/icon.png',
    } as unknown as vscode.Webview;

    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      webview: mockWebview,
    });
    expect(result).toBe('vscode-webview://host/some/path/icon.png');
  });

  it('uses toString() on webview URI when it returns a useful string', () => {
    const mockWebview = {
      asWebviewUri: (_uri: unknown) => ({
        toString: () => 'vscode-webview://host/icon.png',
      }),
    } as unknown as vscode.Webview;

    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      webview: mockWebview,
    });
    expect(result).toContain('vscode-webview://host/icon.png');
  });

  it('falls back to path property when webview URI toString returns [object Object]', () => {
    const mockWebview = {
      asWebviewUri: (_uri: unknown) => ({
        toString: () => '[object Object]',
        path: '/fallback/path/icon.png',
      }),
    } as unknown as vscode.Webview;

    const result = resolveGraphViewAssetPath({
      assetPath: 'assets/icon.png',
      extensionUri,
      pluginExtensionUris,
      webview: mockWebview,
    });
    expect(result).toContain('/fallback/path');
  });
});
