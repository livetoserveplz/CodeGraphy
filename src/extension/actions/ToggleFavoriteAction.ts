/**
 * @fileoverview Undoable action for toggling favorites.
 * @module extension/actions/ToggleFavoriteAction
 */

import * as vscode from 'vscode';
import { IUndoableAction } from '../UndoManager';

/**
 * Action for toggling favorite status of files.
 * Captures the state before the toggle so it can be reversed.
 */
export class ToggleFavoriteAction implements IUndoableAction {
  readonly description: string;
  
  /** Paths that were added to favorites (need to remove on undo) */
  private _added: string[] = [];
  /** Paths that were removed from favorites (need to re-add on undo) */
  private _removed: string[] = [];

  /**
   * Creates a new ToggleFavoriteAction.
   * @param paths - File paths to toggle
   * @param sendFavorites - Callback to notify webview of changes
   */
  constructor(
    private readonly _paths: string[],
    private readonly _sendFavorites: () => void
  ) {
    this.description = _paths.length === 1
      ? `Toggle favorite: ${_paths[0].split('/').pop()}`
      : `Toggle ${_paths.length} favorites`;
  }

  async execute(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codegraphy');
    const favorites = new Set<string>(config.get<string[]>('favorites', []));

    // Track what we're adding vs removing
    this._added = [];
    this._removed = [];

    for (const path of this._paths) {
      if (favorites.has(path)) {
        favorites.delete(path);
        this._removed.push(path);
      } else {
        favorites.add(path);
        this._added.push(path);
      }
    }

    await config.update('favorites', Array.from(favorites), vscode.ConfigurationTarget.Workspace);
    this._sendFavorites();
  }

  async undo(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codegraphy');
    const favorites = new Set<string>(config.get<string[]>('favorites', []));

    // Reverse the changes
    for (const path of this._added) {
      favorites.delete(path);
    }
    for (const path of this._removed) {
      favorites.add(path);
    }

    await config.update('favorites', Array.from(favorites), vscode.ConfigurationTarget.Workspace);
    this._sendFavorites();
  }
}
