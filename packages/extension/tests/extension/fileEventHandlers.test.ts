import { describe, it, expect } from 'vitest';
import { shouldIgnoreSaveForGraphRefresh } from '../../src/extension/fileEventHandlers';

function makeDocument(fsPath: string): { uri: { fsPath: string } } {
  return { uri: { fsPath } };
}

describe('shouldIgnoreSaveForGraphRefresh', () => {
  it('returns true for .vscode/settings.json', () => {
    const doc = makeDocument('/workspace/.vscode/settings.json');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(true);
  });

  it('returns true for .vscode/tasks.json', () => {
    const doc = makeDocument('/workspace/.vscode/tasks.json');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(true);
  });

  it('returns true for .vscode/launch.json', () => {
    const doc = makeDocument('/workspace/.vscode/launch.json');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(true);
  });

  it('returns true for a .code-workspace file', () => {
    const doc = makeDocument('/projects/myproject.code-workspace');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(true);
  });

  it('returns false for a regular TypeScript source file', () => {
    const doc = makeDocument('/workspace/src/app.ts');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(false);
  });

  it('returns false for a markdown file', () => {
    const doc = makeDocument('/workspace/README.md');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(false);
  });

  it('returns false when fsPath is undefined', () => {
    const doc = { uri: {} } as unknown as import('vscode').TextDocument;
    expect(shouldIgnoreSaveForGraphRefresh(doc)).toBe(false);
  });

  it('normalizes Windows backslash paths', () => {
    const doc = makeDocument('C:\\workspace\\.vscode\\settings.json');
    expect(shouldIgnoreSaveForGraphRefresh(doc as import('vscode').TextDocument)).toBe(true);
  });
});
