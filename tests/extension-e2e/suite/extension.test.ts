/**
 * Extension E2E tests.
 * Tests real VS Code integration.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension E2E Tests', () => {
  // Wait for extension to activate
  suiteSetup(async function () {
    this.timeout(30000);
    
    // Get our extension
    const ext = vscode.extensions.getExtension('joesobo.codegraphy');
    if (!ext) {
      throw new Error('Extension not found');
    }
    
    // Activate if not already active
    if (!ext.isActive) {
      await ext.activate();
    }
  });

  test('Extension should be present', () => {
    const ext = vscode.extensions.getExtension('joesobo.codegraphy');
    assert.ok(ext, 'Extension should be installed');
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('joesobo.codegraphy');
    assert.ok(ext?.isActive, 'Extension should be active');
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    
    const expectedCommands = [
      'codegraphy.open',
      'codegraphy.fitView',
      'codegraphy.zoomIn',
      'codegraphy.zoomOut',
      'codegraphy.undo',
      'codegraphy.redo',
      'codegraphy.exportPng',
      'codegraphy.exportSvg',
      'codegraphy.exportJson',
      'codegraphy.clearCache',
    ];

    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `Command '${cmd}' should be registered`
      );
    }
  });

  test('Open command should execute without error', async function () {
    this.timeout(10000);
    
    // Execute the open command - this opens the CodeGraphy view
    await vscode.commands.executeCommand('codegraphy.open');
    
    // Give it a moment to open
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // If we get here without throwing, the command executed successfully
    assert.ok(true);
  });

  test('Webview should be registered', async () => {
    // Check that our webview view is registered
    // Note: We can't directly check webview registration, 
    // but we can verify the view container exists
    const ext = vscode.extensions.getExtension('joesobo.codegraphy');
    const packageJson = ext?.packageJSON;
    
    assert.ok(
      packageJson?.contributes?.views?.codegraphy,
      'Webview view should be contributed'
    );
  });
});

suite('Configuration Tests', () => {
  test('Default configuration values should exist', () => {
    // Physics settings should have defaults
    const physics = vscode.workspace.getConfiguration('codegraphy.physics');
    assert.strictEqual(
      typeof physics.get('gravitationalConstant'),
      'number',
      'gravitationalConstant should be a number'
    );
    assert.strictEqual(
      typeof physics.get('springLength'),
      'number',
      'springLength should be a number'
    );
  });

  test('Configuration should be writable', async () => {
    const config = vscode.workspace.getConfiguration('codegraphy.physics');
    
    // Get current value
    const originalValue = config.get<number>('gravitationalConstant');
    
    // Update to test value
    await config.update('gravitationalConstant', -100, vscode.ConfigurationTarget.Global);
    
    // Verify update
    const newValue = config.get<number>('gravitationalConstant');
    assert.strictEqual(newValue, -100, 'Config should be updated');
    
    // Restore original value
    await config.update('gravitationalConstant', originalValue, vscode.ConfigurationTarget.Global);
  });
});
