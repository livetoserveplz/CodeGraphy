import { describe, it, expect } from 'vitest';
import {
  buildOpenBlock,
  buildCopyBlock,
  buildFavoriteBlock,
  buildDestructiveBlock,
} from '../../src/webview/components/graphContextMenu/nodeActionBlocks';
import type { GraphContextMenuEntry } from '../../src/webview/components/graphContextMenu/types';

function itemLabels(entries: GraphContextMenuEntry[]): string[] {
  return entries
    .filter((entry): entry is Extract<GraphContextMenuEntry, { kind: 'item' }> => entry.kind === 'item')
    .map(entry => entry.label);
}

function separatorIds(entries: GraphContextMenuEntry[]): string[] {
  return entries
    .filter((entry): entry is Extract<GraphContextMenuEntry, { kind: 'separator' }> => entry.kind === 'separator')
    .map(entry => entry.id);
}

describe('buildOpenBlock', () => {
  it('shows Open File for a single target', () => {
    const entries = buildOpenBlock(['src/app.ts'], false);
    expect(itemLabels(entries)).toContain('Open File');
  });

  it('shows Open N Files for multiple targets', () => {
    const entries = buildOpenBlock(['src/a.ts', 'src/b.ts'], false);
    expect(itemLabels(entries)).toContain('Open 2 Files');
  });

  it('includes Reveal in Explorer for single target when timeline is inactive', () => {
    const entries = buildOpenBlock(['src/app.ts'], false);
    expect(itemLabels(entries)).toContain('Reveal in Explorer');
  });

  it('omits Reveal in Explorer when timeline is active', () => {
    const entries = buildOpenBlock(['src/app.ts'], true);
    expect(itemLabels(entries)).not.toContain('Reveal in Explorer');
  });

  it('omits Reveal in Explorer for multiple targets even when timeline is inactive', () => {
    const entries = buildOpenBlock(['src/a.ts', 'src/b.ts'], false);
    expect(itemLabels(entries)).not.toContain('Reveal in Explorer');
  });
});

describe('buildCopyBlock', () => {
  it('includes a separator before copy entries', () => {
    const entries = buildCopyBlock(['src/app.ts']);
    expect(separatorIds(entries)).toContain('node-separator-copy');
  });

  it('shows Copy Relative Path for a single target', () => {
    const entries = buildCopyBlock(['src/app.ts']);
    expect(itemLabels(entries)).toContain('Copy Relative Path');
  });

  it('shows Copy Relative Paths for multiple targets', () => {
    const entries = buildCopyBlock(['src/a.ts', 'src/b.ts']);
    expect(itemLabels(entries)).toContain('Copy Relative Paths');
  });

  it('shows Copy Absolute Path for a single target', () => {
    const entries = buildCopyBlock(['src/app.ts']);
    expect(itemLabels(entries)).toContain('Copy Absolute Path');
  });

  it('omits Copy Absolute Path for multiple targets', () => {
    const entries = buildCopyBlock(['src/a.ts', 'src/b.ts']);
    expect(itemLabels(entries)).not.toContain('Copy Absolute Path');
  });
});

describe('buildFavoriteBlock', () => {
  it('includes a separator before favorite entries', () => {
    const entries = buildFavoriteBlock(['src/app.ts'], new Set());
    expect(separatorIds(entries)).toContain('node-separator-favorites');
  });

  it('shows Add to Favorites when target is not favorited', () => {
    const entries = buildFavoriteBlock(['src/app.ts'], new Set());
    expect(itemLabels(entries)).toContain('Add to Favorites');
  });

  it('shows Remove from Favorites when target is already favorited', () => {
    const entries = buildFavoriteBlock(['src/app.ts'], new Set(['src/app.ts']));
    expect(itemLabels(entries)).toContain('Remove from Favorites');
  });

  it('shows Add All to Favorites for multiple unfavorited targets', () => {
    const entries = buildFavoriteBlock(['src/a.ts', 'src/b.ts'], new Set());
    expect(itemLabels(entries)).toContain('Add All to Favorites');
  });

  it('shows Remove All from Favorites when all targets are favorited', () => {
    const entries = buildFavoriteBlock(['src/a.ts', 'src/b.ts'], new Set(['src/a.ts', 'src/b.ts']));
    expect(itemLabels(entries)).toContain('Remove All from Favorites');
  });

  it('shows Add All to Favorites when only some targets are favorited', () => {
    const entries = buildFavoriteBlock(['src/a.ts', 'src/b.ts'], new Set(['src/a.ts']));
    expect(itemLabels(entries)).toContain('Add All to Favorites');
  });

  it('includes Focus Node for a single target', () => {
    const entries = buildFavoriteBlock(['src/app.ts'], new Set());
    expect(itemLabels(entries)).toContain('Focus Node');
  });

  it('omits Focus Node for multiple targets', () => {
    const entries = buildFavoriteBlock(['src/a.ts', 'src/b.ts'], new Set());
    expect(itemLabels(entries)).not.toContain('Focus Node');
  });
});

describe('buildDestructiveBlock', () => {
  it('includes both destructive separators', () => {
    const entries = buildDestructiveBlock(['src/app.ts']);
    const ids = separatorIds(entries);
    expect(ids).toContain('node-separator-destructive-1');
    expect(ids).toContain('node-separator-destructive-2');
  });

  it('shows Add to Filter for a single target', () => {
    const entries = buildDestructiveBlock(['src/app.ts']);
    expect(itemLabels(entries)).toContain('Add to Filter');
  });

  it('shows Add All to Filter for multiple targets', () => {
    const entries = buildDestructiveBlock(['src/a.ts', 'src/b.ts']);
    expect(itemLabels(entries)).toContain('Add All to Filter');
  });

  it('shows Rename for a single target', () => {
    const entries = buildDestructiveBlock(['src/app.ts']);
    expect(itemLabels(entries)).toContain('Rename...');
  });

  it('omits Rename for multiple targets', () => {
    const entries = buildDestructiveBlock(['src/a.ts', 'src/b.ts']);
    expect(itemLabels(entries)).not.toContain('Rename...');
  });

  it('shows Delete File for a single target', () => {
    const entries = buildDestructiveBlock(['src/app.ts']);
    expect(itemLabels(entries)).toContain('Delete File');
  });

  it('shows Delete N Files for multiple targets', () => {
    const entries = buildDestructiveBlock(['src/a.ts', 'src/b.ts']);
    expect(itemLabels(entries)).toContain('Delete 2 Files');
  });

  it('marks the delete entry as destructive', () => {
    const entries = buildDestructiveBlock(['src/app.ts']);
    const deleteEntry = entries.find(
      (entry): entry is Extract<GraphContextMenuEntry, { kind: 'item' }> =>
        entry.kind === 'item' && entry.label === 'Delete File'
    );
    expect(deleteEntry?.destructive).toBe(true);
  });
});
