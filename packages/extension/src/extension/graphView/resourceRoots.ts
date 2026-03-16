import * as vscode from 'vscode';

/**
 * Returns a stable string key for a VS Code URI, used for de-duplication in maps.
 * Handles real VS Code URIs and test mocks that may lack certain properties.
 */
export function getGraphViewUriKey(uri: vscode.Uri): string {
  const candidate = uri as unknown as { fsPath?: string; path?: string; toString(): string };
  return candidate.fsPath ?? candidate.path ?? candidate.toString();
}

/**
 * Returns all local resource roots needed for graph view webviews.
 * Includes the extension root, all registered plugin extension roots,
 * and all workspace folders (so .codegraphy/assets/ images can be served).
 */
export function getGraphViewLocalResourceRoots(
  extensionUri: vscode.Uri,
  pluginExtensionUris: ReadonlyMap<string, vscode.Uri>
): vscode.Uri[] {
  const roots = new Map<string, vscode.Uri>();
  roots.set(getGraphViewUriKey(extensionUri), extensionUri);
  for (const uri of pluginExtensionUris.values()) {
    roots.set(getGraphViewUriKey(uri), uri);
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    roots.set(getGraphViewUriKey(folder.uri), folder.uri);
  }
  return [...roots.values()];
}
