/**
 * @fileoverview Undoable action for adding patterns to exclude list.
 * @module extension/actions/AddToExcludeAction
 */

import * as vscode from 'vscode';
import { IUndoableAction } from '../UndoManager';

/**
 * Action for adding patterns to the exclude list.
 * Stores the patterns that were actually new so they can be removed on undo.
 */
export class AddToExcludeAction implements IUndoableAction {
  readonly description: string;
  
  /** Patterns that were actually added (not already in list) */
  private _addedPatterns: string[] = [];

  /**
   * Creates a new AddToExcludeAction.
   * @param paths - File paths to exclude
   * @param refreshGraph - Callback to refresh the graph after changes
   */
  constructor(
    private readonly _paths: string[],
    private readonly _refreshGraph: () => Promise<void>
  ) {
    this.description = _paths.length === 1
      ? `Exclude: ${_paths[0].split('/').pop()}`
      : `Exclude ${_paths.length} files`;
  }

  async execute(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codegraphy');
    const currentExclude = new Set<string>(config.get<string[]>('exclude', []));

    // Convert file paths to glob patterns and track which are new
    this._addedPatterns = [];
    for (const path of this._paths) {
      const pattern = `**/${path}`;
      if (!currentExclude.has(pattern)) {
        currentExclude.add(pattern);
        this._addedPatterns.push(pattern);
      }
    }

    await config.update('exclude', Array.from(currentExclude), vscode.ConfigurationTarget.Workspace);
    await this._refreshGraph();
  }

  async undo(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codegraphy');
    const currentExclude = new Set<string>(config.get<string[]>('exclude', []));

    // Remove only the patterns we added
    for (const pattern of this._addedPatterns) {
      currentExclude.delete(pattern);
    }

    await config.update('exclude', Array.from(currentExclude), vscode.ConfigurationTarget.Workspace);
    await this._refreshGraph();
  }
}
