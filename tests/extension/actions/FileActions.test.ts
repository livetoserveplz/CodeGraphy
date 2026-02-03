/**
 * @fileoverview Tests for file undoable actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { DeleteFilesAction } from '../../../src/extension/actions/DeleteFilesAction';
import { RenameFileAction } from '../../../src/extension/actions/RenameFileAction';
import { CreateFileAction } from '../../../src/extension/actions/CreateFileAction';

// Mock vscode module
vi.mock('vscode', () => ({
  workspace: {
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      delete: vi.fn(),
      rename: vi.fn(),
    },
    openTextDocument: vi.fn(),
  },
  window: {
    showTextDocument: vi.fn(),
    visibleTextEditors: [],
    showErrorMessage: vi.fn(),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  Uri: {
    joinPath: vi.fn((base, ...pathSegments) => ({
      fsPath: `${base.fsPath}/${pathSegments.join('/')}`,
      toString: () => `file://${base.fsPath}/${pathSegments.join('/')}`,
    })),
  },
}));

describe('DeleteFilesAction', () => {
  const mockWorkspaceFolder = { fsPath: '/workspace' } as vscode.Uri;
  let mockRefreshGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshGraph = vi.fn().mockResolvedValue(undefined);
    
    // Setup default mock implementations
    (vscode.workspace.fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    );
    (vscode.workspace.fs.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (vscode.workspace.fs.writeFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct description for single file', () => {
    const action = new DeleteFilesAction(
      ['src/test.ts'],
      mockWorkspaceFolder,
      mockRefreshGraph
    );
    expect(action.description).toBe('Delete: test.ts');
  });

  it('should have correct description for multiple files', () => {
    const action = new DeleteFilesAction(
      ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      mockWorkspaceFolder,
      mockRefreshGraph
    );
    expect(action.description).toBe('Delete 3 files');
  });

  it('should read file contents before deleting on execute', async () => {
    const action = new DeleteFilesAction(
      ['src/test.ts'],
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();

    expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(1);
    expect(vscode.workspace.fs.delete).toHaveBeenCalledTimes(1);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(1);
  });

  it('should restore file contents on undo', async () => {
    const action = new DeleteFilesAction(
      ['src/test.ts'],
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();
    await action.undo();

    expect(vscode.workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(2); // Once for execute, once for undo
  });

  it('should handle multiple files', async () => {
    const action = new DeleteFilesAction(
      ['src/a.ts', 'src/b.ts'],
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();

    expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(2);
    expect(vscode.workspace.fs.delete).toHaveBeenCalledTimes(2);
  });
});

describe('RenameFileAction', () => {
  const mockWorkspaceFolder = { fsPath: '/workspace' } as vscode.Uri;
  let mockRefreshGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshGraph = vi.fn().mockResolvedValue(undefined);
    (vscode.workspace.fs.rename as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct description', () => {
    const action = new RenameFileAction(
      'src/old.ts',
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );
    expect(action.description).toBe('Rename: old.ts → new.ts');
  });

  it('should rename file on execute', async () => {
    const action = new RenameFileAction(
      'src/old.ts',
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();

    expect(vscode.workspace.fs.rename).toHaveBeenCalledTimes(1);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(1);
  });

  it('should reverse rename on undo', async () => {
    const action = new RenameFileAction(
      'src/old.ts',
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();
    await action.undo();

    // rename should be called twice - once for execute, once for undo (reversed)
    expect(vscode.workspace.fs.rename).toHaveBeenCalledTimes(2);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(2);
  });
});

describe('CreateFileAction', () => {
  const mockWorkspaceFolder = { fsPath: '/workspace' } as vscode.Uri;
  let mockRefreshGraph: ReturnType<typeof vi.fn>;
  let mockDocument: { uri: { toString: () => string } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshGraph = vi.fn().mockResolvedValue(undefined);
    mockDocument = { uri: { toString: () => 'file:///workspace/src/new.ts' } };
    
    (vscode.workspace.fs.writeFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (vscode.workspace.fs.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (vscode.workspace.openTextDocument as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocument);
    (vscode.window.showTextDocument as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct description', () => {
    const action = new CreateFileAction(
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );
    expect(action.description).toBe('Create: new.ts');
  });

  it('should create file and open in editor on execute', async () => {
    const action = new CreateFileAction(
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();

    expect(vscode.workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledTimes(1);
    expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(1);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(1);
  });

  it('should delete file on undo', async () => {
    const action = new CreateFileAction(
      'src/new.ts',
      mockWorkspaceFolder,
      mockRefreshGraph
    );

    await action.execute();
    
    // Reset mock to not have visible editors
    (vscode.window as { visibleTextEditors: unknown[] }).visibleTextEditors = [];
    
    await action.undo();

    expect(vscode.workspace.fs.delete).toHaveBeenCalledTimes(1);
    expect(mockRefreshGraph).toHaveBeenCalledTimes(2);
  });
});
