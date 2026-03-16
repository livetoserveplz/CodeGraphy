import * as vscode from 'vscode';
import { GraphViewProvider } from './GraphViewProvider';
import type { IGraphData } from '../shared/types';
import { handleConfigurationChange } from './configHandler';
import { registerCommands } from './commandRegistration';
import {
  registerActiveEditorHandler,
  registerSaveHandler,
  registerFileWatcherHandlers,
} from './fileEventHandlers';

/** Public API returned by activate() — usable from e2e tests. */
export interface CodeGraphyAPI {
  /** Current graph data (nodes + edges) after the last analysis. */
  getGraphData(): IGraphData;
  /** Send a raw message to the webview panel (mirrors extension→webview channel). */
  sendToWebview(message: unknown): void;
  /** Listen for messages sent from the webview. Returns a disposable. */
  onWebviewMessage(handler: (message: unknown) => void): vscode.Disposable;
  /** Register an external v2 plugin. */
  registerPlugin(plugin: unknown, options?: { extensionUri?: vscode.Uri | string }): void;
}

export function activate(context: vscode.ExtensionContext): CodeGraphyAPI {
  const provider = new GraphViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GraphViewProvider.viewType,
      provider
    )
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      handleConfigurationChange(event, provider);
    })
  );

  // Track file visits and update focused file when active editor changes
  registerActiveEditorHandler(context, provider);

  // Refresh graph when files are saved (debounced)
  registerSaveHandler(context, provider);

  // Refresh graph when files are created or deleted
  registerFileWatcherHandlers(context, provider);

  // Register commands
  registerCommands(context, provider);

  return {
    getGraphData: () => provider.getGraphData(),
    sendToWebview: (message) => provider.sendToWebview(message),
    onWebviewMessage: (handler) => provider.onWebviewMessage(handler),
    registerPlugin: (plugin: unknown, options?: { extensionUri?: vscode.Uri | string }) =>
      provider.registerExternalPlugin(plugin, options),
  };
}

export function deactivate(): void {
  // Cleanup if needed
}
