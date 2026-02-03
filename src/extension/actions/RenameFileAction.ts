/**
 * @fileoverview Undoable action for renaming files.
 * @module extension/actions/RenameFileAction
 */

import * as vscode from 'vscode';
import { IUndoableAction } from '../UndoManager';

/**
 * Action for renaming a file with undo support.
 * Tracks old and new paths to reverse the rename.
 * Also updates favorites list to track the file through renames.
 */
export class RenameFileAction implements IUndoableAction {
  readonly description: string;

  /** Whether the old path was in favorites before rename */
  private _wasInFavorites = false;

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

    // Check if file was in favorites before rename
    const config = vscode.workspace.getConfiguration('codegraphy');
    const favorites = config.get<string[]>('favorites', []);
    this._wasInFavorites = favorites.includes(this._oldPath);

    // Rename the file
    await vscode.workspace.fs.rename(oldUri, newUri);

    // Update favorites to track the file through the rename
    if (this._wasInFavorites) {
      const updatedFavorites = favorites.map(f => f === this._oldPath ? this._newPath : f);
      await config.update('favorites', updatedFavorites, vscode.ConfigurationTarget.Workspace);
    }

    await this._refreshGraph();
  }

  async undo(): Promise<void> {
    // Reverse the rename
    const oldUri = vscode.Uri.joinPath(this._workspaceFolder, this._oldPath);
    const newUri = vscode.Uri.joinPath(this._workspaceFolder, this._newPath);

    await vscode.workspace.fs.rename(newUri, oldUri);

    // Restore favorites to use old path
    if (this._wasInFavorites) {
      const config = vscode.workspace.getConfiguration('codegraphy');
      const favorites = config.get<string[]>('favorites', []);
      const restoredFavorites = favorites.map(f => f === this._newPath ? this._oldPath : f);
      await config.update('favorites', restoredFavorites, vscode.ConfigurationTarget.Workspace);
    }

    await this._refreshGraph();
  }
}
