import * as vscode from 'vscode';
import * as path from 'path';
import { getGraphViewUriKey } from './resourceRoots';

/**
 * Normalizes an external plugin extension URI from API input.
 * Accepts a URI object, string path, or undefined. Returns a vscode.Uri or undefined.
 */
export function normalizeGraphViewExtensionUri(
  uri: vscode.Uri | string | undefined
): vscode.Uri | undefined {
  if (!uri) return undefined;
  if (typeof uri === 'string') {
    return vscode.Uri.file(uri);
  }
  return uri;
}

/**
 * Resolves an asset path for webview consumption.
 *
 * - Absolute URIs (e.g. https://...) are returned as-is.
 * - Absolute file paths are converted via vscode.Uri.file().
 * - Relative paths are joined against the plugin root (if pluginId is known)
 *   or the extension root.
 * - When a webview is provided, the resulting URI is converted to a webview URI.
 */
export function resolveGraphViewAssetPath(opts: {
  assetPath: string;
  extensionUri: vscode.Uri;
  pluginExtensionUris: ReadonlyMap<string, vscode.Uri>;
  pluginId?: string;
  webview?: vscode.Webview;
}): string {
  const { assetPath, extensionUri, pluginExtensionUris, pluginId, webview } = opts;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const pluginRoot = pluginId ? pluginExtensionUris.get(pluginId) : undefined;
  const fileUri = path.isAbsolute(assetPath)
    ? vscode.Uri.file(assetPath)
    : vscode.Uri.joinPath(pluginRoot ?? extensionUri, assetPath);

  if (!webview) {
    return fileUri.toString();
  }

  const webviewUri = webview.asWebviewUri(fileUri) as unknown;
  if (typeof webviewUri === 'string') {
    return webviewUri;
  }
  if (
    webviewUri &&
    typeof (webviewUri as { toString?: () => string }).toString === 'function'
  ) {
    const text = (webviewUri as { toString: () => string }).toString();
    if (text && text !== '[object Object]') {
      return text;
    }
  }

  // Test mocks may provide plain URI objects without a useful toString().
  const pathLike = webviewUri as { path?: string; fsPath?: string } | null;
  return pathLike?.path ?? pathLike?.fsPath ?? String(webviewUri);
}

export { getGraphViewUriKey };
