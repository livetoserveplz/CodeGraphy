import * as path from 'path';

/**
 * Parse LCOV content into a map of workspace-relative path -> line coverage percent.
 */
export function parseLcovCoverage(lcovContent: string, workspaceRoot: string): Map<string, number> {
  const result = new Map<string, number>();
  if (!lcovContent.trim()) return result;

  const lines = lcovContent.split(/\r?\n/);
  let currentFile: string | null = null;
  let totalLines = 0;
  let hitLines = 0;

  const flushRecord = (): void => {
    if (!currentFile || totalLines === 0) return;
    const normalized = normalizeToWorkspaceRelative(currentFile, workspaceRoot);
    if (!normalized) return;
    const percent = Number(((hitLines / totalLines) * 100).toFixed(1));
    result.set(normalized, percent);
  };

  for (const line of lines) {
    if (line.startsWith('SF:')) {
      flushRecord();
      currentFile = line.slice(3).trim();
      totalLines = 0;
      hitLines = 0;
      continue;
    }

    if (line.startsWith('DA:')) {
      const payload = line.slice(3).trim();
      const [, hitPart] = payload.split(',');
      const hits = Number(hitPart);
      if (Number.isFinite(hits)) {
        totalLines += 1;
        if (hits > 0) hitLines += 1;
      }
      continue;
    }

    if (line === 'end_of_record') {
      flushRecord();
      currentFile = null;
      totalLines = 0;
      hitLines = 0;
    }
  }

  flushRecord();
  return result;
}

function normalizeToWorkspaceRelative(filePath: string, workspaceRoot: string): string | null {
  const normalizedWorkspace = workspaceRoot.replace(/\\/g, '/');
  const normalizedFile = filePath.replace(/\\/g, '/');

  // Absolute path under workspace
  if (path.isAbsolute(filePath)) {
    const rel = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    if (rel.startsWith('..')) return null;
    return rel;
  }

  // Relative path from LCOV
  const cleaned = normalizedFile.startsWith('./') ? normalizedFile.slice(2) : normalizedFile;
  if (!cleaned || cleaned.startsWith('../')) return null;

  // Handle weird but valid prefixes that include workspace root
  if (cleaned.startsWith(normalizedWorkspace)) {
    const rel = cleaned.slice(normalizedWorkspace.length).replace(/^\//, '');
    return rel || null;
  }

  return cleaned;
}
