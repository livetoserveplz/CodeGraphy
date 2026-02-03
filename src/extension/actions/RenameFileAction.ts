/**
 * @fileoverview Undoable action for renaming files.
 * @module extension/actions/RenameFileAction
 */

import * as vscode from 'vscode';
import { IUndoableAction } from '../UndoManager';

/**
 * Action for renaming a file with undo support.
 * Tracks old and new paths to reverse the rename.
 */
export class RenameFileAction implements IUndoableAction {
  readonly description: string;

  /**
   * Creates a new RenameFileAction.
   * @param oldPath - Original file path (workspace-relative)
   * @param newPath - New file path (workspace-relative)
   * @param workspaceFolder - The workspace folder URI
   * @param refreshGraph - Callback to refresh the graph after changes
   */
  constructor(
    private readonly _oldPath: string,
    private readonly _newPath: string,
    private readonly _workspaceFolder: vscode.Uri,
    private readonly _refreshGraph: () => Promise<void>
  ) {
    const oldName = _oldPath.split('/').pop();
    const newName = _newPath.split('/').pop();
    this.description = `Rename: ${oldName} → ${newName}`;
  }

  async execute(): Promise<void> {
    const oldUri = vscode.Uri.joinPath(this._workspaceFolder, this._oldPath);
    const newUri = vscode.Uri.joinPath(this._workspaceFolder, this._newPath);

    await vscode.workspace.fs.rename(oldUri, newUri);
    await this._refreshGraph();
  }

  async undo(): Promise<void> {
    // Reverse the rename
    const oldUri = vscode.Uri.joinPath(this._workspaceFolder, this._oldPath);
    const newUri = vscode.Uri.joinPath(this._workspaceFolder, this._newPath);

    await vscode.workspace.fs.rename(newUri, oldUri);
    await this._refreshGraph();
  }
}
