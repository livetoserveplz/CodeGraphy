/**
 * Visual test entry point.
 * Sets up the webview with mocked VSCode API for Playwright testing.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../src/webview/App';
import '../../src/webview/index.css';
import { mockVsCodeApi, sendMockMessage } from './mocks/vscodeApi';
import { testFixtures } from './fixtures';

// Install mock VSCode API before anything else
mockVsCodeApi();

// Parse URL params to determine which fixture to load
const params = new URLSearchParams(window.location.search);
const fixtureName = params.get('fixture') || 'default';
const theme = (params.get('theme') || 'dark') as 'dark' | 'light';

// Apply theme to body for CSS
document.body.setAttribute('data-vscode-theme-kind', theme === 'light' ? 'vscode-light' : 'vscode-dark');

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// After mount, send initial data based on fixture
setTimeout(() => {
  const fixture = testFixtures[fixtureName] || testFixtures.default;
  
  // Send graph data
  sendMockMessage({
    type: 'GRAPH_DATA_UPDATED',
    payload: fixture.graphData,
  });
  
  // Send favorites if any
  sendMockMessage({
    type: 'FAVORITES_UPDATED',
    payload: { favorites: fixture.favorites || [] },
  });
  
  // Send settings
  sendMockMessage({
    type: 'SETTINGS_UPDATED',
    payload: { bidirectionalEdges: fixture.bidirectionalEdges || 'separate' },
  });
  
  // Send physics settings
  sendMockMessage({
    type: 'PHYSICS_SETTINGS_UPDATED',
    payload: fixture.physicsSettings || {
      gravitationalConstant: -50,
      springLength: 100,
      springConstant: 0.08,
      damping: 0.4,
      centralGravity: 0.01,
    },
  });
  
  // Send available views
  sendMockMessage({
    type: 'VIEWS_UPDATED',
    payload: {
      views: fixture.views || [
        { id: 'codegraphy.connections', name: 'Connections', active: true },
      ],
      activeViewId: 'codegraphy.connections',
    },
  });
}, 100);

// Expose helper for Playwright to interact with
declare global {
  interface Window {
    __VISUAL_TEST__: {
      sendMessage: typeof sendMockMessage;
      fixtures: typeof testFixtures;
      setTheme: (theme: 'dark' | 'light') => void;
    };
  }
}

window.__VISUAL_TEST__ = {
  sendMessage: sendMockMessage,
  fixtures: testFixtures,
  setTheme: (theme: 'dark' | 'light') => {
    document.body.setAttribute('data-vscode-theme-kind', theme === 'light' ? 'vscode-light' : 'vscode-dark');
  },
};
