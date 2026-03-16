/**
 * @fileoverview File event handlers for the CodeGraphy extension.
 * Handles editor change, save, and file watcher events that trigger graph refresh.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { GraphViewProvider } from './GraphViewProvider';

/**
 * Returns true when a saved document should not trigger graph re-analysis.
 * We skip workspace/config saves to avoid graph resets while changing settings.
 */
export function shouldIgnoreSaveForGraphRefresh(document: vscode.TextDocument): boolean {
  const filePath = document.uri?.fsPath;
  if (!filePath) return false;

  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.endsWith('/.vscode/settings.json') ||
    normalized.endsWith('/.vscode/tasks.json') ||
    normalized.endsWith('/.vscode/launch.json') ||
    normalized.endsWith('.code-workspace')
  );
}

/**
 * Registers the active editor change listener that tracks file visits
 * and updates the focused file for depth graph view.
 */
export function registerActiveEditorHandler(
  context: vscode.ExtensionContext,
  provider: GraphViewProvider
): void {
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor && editor.document.uri.scheme === 'file') {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
          const relativePath = path.relative(
            workspaceFolder.uri.fsPath,
            editor.document.uri.fsPath
          );
          // Only track files within the workspace (not external files)
          if (!relativePath.startsWith('..')) {
            // Normalize to forward slashes for consistency
            const normalizedPath = relativePath.replace(/\\/g, '/');
            await provider.trackFileVisit(normalizedPath);
            // Update focused file for depth graph view
            provider.setFocusedFile(normalizedPath);
            // Emit event for v2 plugins
            provider.emitEvent('workspace:activeEditorChanged', { filePath: normalizedPath });
          }
        }
      } else {
        // No editor or external file - clear focused file
        provider.setFocusedFile(undefined);
        provider.emitEvent('workspace:activeEditorChanged', { filePath: undefined });
      }
    })
  );
}

/**
 * Registers the file save listener that triggers graph refresh with debouncing.
 * Returns the save timeout handle so callers can track it if needed.
 */
export function registerSaveHandler(
  context: vscode.ExtensionContext,
  provider: GraphViewProvider
): void {
  let saveTimeout: ReturnType<typeof setTimeout> | undefined;

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (shouldIgnoreSaveForGraphRefresh(document)) {
        return;
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(() => {
        console.log('[CodeGraphy] File saved, refreshing graph');
        void provider.refresh();
        provider.emitEvent('workspace:fileChanged', { filePath: document.uri.fsPath });
      }, 500);
    })
  );
}

/**
 * Registers file system watchers for file creation and deletion events.
 */
export function registerFileWatcherHandlers(
  context: vscode.ExtensionContext,
  provider: GraphViewProvider
): void {
  const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

  context.subscriptions.push(
    fileWatcher.onDidCreate((uri) => {
      console.log('[CodeGraphy] File created, refreshing graph');
      void provider.refresh();
      provider.emitEvent('workspace:fileCreated', { filePath: uri.fsPath });
    })
  );

  context.subscriptions.push(
    fileWatcher.onDidDelete((uri) => {
      console.log('[CodeGraphy] File deleted, refreshing graph');
      void provider.refresh();
      provider.emitEvent('workspace:fileDeleted', { filePath: uri.fsPath });
    })
  );

  context.subscriptions.push(fileWatcher);
}
