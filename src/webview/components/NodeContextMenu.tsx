/**
 * Context menu for graph nodes with file operations.
 */

import * as React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from './ui/context-menu';

interface NodeContextMenuProps {
  /** Selected node IDs */
  selectedNodes: string[];
  /** Favorite node IDs */
  favorites: Set<string>;
  /** Whether context menu is for background (no node) */
  isBackground?: boolean;
  /** Position to show menu */
  position: { x: number; y: number } | null;
  /** Callback when menu closes */
  onClose: () => void;
  /** Callback for actions */
  onAction: (action: ContextMenuAction) => void;
  children: React.ReactNode;
}

export type ContextMenuAction =
  | { type: 'open'; paths: string[] }
  | { type: 'reveal'; path: string }
  | { type: 'copyPath'; paths: string[]; absolute?: boolean }
  | { type: 'delete'; paths: string[] }
  | { type: 'rename'; path: string }
  | { type: 'toggleFavorite'; paths: string[] }
  | { type: 'addToExclude'; paths: string[] }
  | { type: 'focus'; nodeId: string }
  | { type: 'refresh' }
  | { type: 'fitView' }
  | { type: 'createFile' };

export function NodeContextMenu({
  selectedNodes,
  favorites,
  isBackground,
  onAction,
  children,
}: NodeContextMenuProps) {
  const isMultiSelect = selectedNodes.length > 1;
  const isSingleSelect = selectedNodes.length === 1;
  const allFavorited = selectedNodes.every(id => favorites.has(id));

  // Background menu (right-click on empty space)
  if (isBackground) {
    return (
      <ContextMenu>
        {children}
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => onAction({ type: 'createFile' })}>
            New File...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onAction({ type: 'refresh' })}>
            Refresh Graph
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAction({ type: 'fitView' })}>
            Fit All Nodes
            <ContextMenuShortcut>0</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Node menu (right-click on node)
  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-64">
        {/* File Operations */}
        <ContextMenuItem onClick={() => onAction({ type: 'open', paths: selectedNodes })}>
          {isMultiSelect ? `Open ${selectedNodes.length} Files` : 'Open File'}
        </ContextMenuItem>
        
        {isSingleSelect && (
          <ContextMenuItem onClick={() => onAction({ type: 'reveal', path: selectedNodes[0] })}>
            Reveal in Explorer
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Copy Operations */}
        <ContextMenuItem onClick={() => onAction({ type: 'copyPath', paths: selectedNodes })}>
          {isMultiSelect ? 'Copy Relative Paths' : 'Copy Relative Path'}
        </ContextMenuItem>
        
        {isSingleSelect && (
          <ContextMenuItem onClick={() => onAction({ type: 'copyPath', paths: selectedNodes, absolute: true })}>
            Copy Absolute Path
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Favorites */}
        <ContextMenuItem onClick={() => onAction({ type: 'toggleFavorite', paths: selectedNodes })}>
          {allFavorited
            ? (isMultiSelect ? 'Remove All from Favorites' : 'Remove from Favorites')
            : (isMultiSelect ? 'Add All to Favorites' : 'Add to Favorites')
          }
        </ContextMenuItem>

        {/* Focus (single select only) */}
        {isSingleSelect && (
          <ContextMenuItem onClick={() => onAction({ type: 'focus', nodeId: selectedNodes[0] })}>
            Focus Node
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Exclude */}
        <ContextMenuItem onClick={() => onAction({ type: 'addToExclude', paths: selectedNodes })}>
          {isMultiSelect ? 'Add All to Exclude' : 'Add to Exclude'}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Dangerous Operations */}
        {isSingleSelect && (
          <ContextMenuItem onClick={() => onAction({ type: 'rename', path: selectedNodes[0] })}>
            Rename...
          </ContextMenuItem>
        )}
        
        <ContextMenuItem 
          destructive
          onClick={() => onAction({ type: 'delete', paths: selectedNodes })}
        >
          {isMultiSelect ? `Delete ${selectedNodes.length} Files` : 'Delete File'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
