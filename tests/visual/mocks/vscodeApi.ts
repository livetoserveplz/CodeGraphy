/**
 * Mock VSCode API for visual testing.
 * Simulates the VSCode webview API that the React app expects.
 */

import type { ExtensionToWebviewMessage } from '../../../src/shared/types';

// Store for messages sent from webview to "extension"
const sentMessages: unknown[] = [];

// Mock vscode API object
const mockApi = {
  postMessage: (message: unknown) => {
    sentMessages.push(message);
    console.log('[Visual Test] Webview sent message:', message);
    
    // Auto-respond to WEBVIEW_READY
    if ((message as { type?: string }).type === 'WEBVIEW_READY') {
      console.log('[Visual Test] Webview ready, will receive fixture data');
    }
  },
  getState: () => undefined,
  setState: () => {},
};

/**
 * Install the mock VSCode API on the window object.
 * Must be called before the React app mounts.
 */
export function mockVsCodeApi(): void {
  // @ts-expect-error - Mocking VSCode API
  window.acquireVsCodeApi = () => mockApi;
}

/**
 * Send a mock message from "extension" to the webview.
 * This simulates messages that would come from GraphViewProvider.
 */
export function sendMockMessage(message: ExtensionToWebviewMessage): void {
  console.log('[Visual Test] Sending message to webview:', message.type);
  window.postMessage(message, '*');
}

/**
 * Get all messages sent from webview to "extension".
 * Useful for asserting that the webview sent expected messages.
 */
export function getSentMessages(): unknown[] {
  return [...sentMessages];
}

/**
 * Clear sent messages.
 */
export function clearSentMessages(): void {
  sentMessages.length = 0;
}
