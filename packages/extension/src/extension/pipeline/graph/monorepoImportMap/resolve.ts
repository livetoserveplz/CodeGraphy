import * as fs from 'node:fs';
import * as path from 'node:path';

export type MonorepoImportMap = Record<string, string>;

const IMPORT_RESOLUTION_EXTENSIONS = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
] as const;

interface MatchedMonorepoImport {
  mappedPath: string;
  packageName: string;
  subpath: string;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function toWorkspaceRelativePath(workspaceRoot: string, absolutePath: string): string | null {
  const relativePath = path.relative(workspaceRoot, absolutePath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return normalizeRelativePath(relativePath);
}

function resolveConfiguredPath(workspaceRoot: string, configuredPath: string): string {
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(workspaceRoot, configuredPath);
}

function findMappedImport(
  specifier: string,
  monorepoImportMap: MonorepoImportMap,
): MatchedMonorepoImport | null {
  return Object.entries(monorepoImportMap)
    .filter(([packageName, mappedPath]) =>
      typeof mappedPath === 'string'
      && mappedPath.length > 0
      && (specifier === packageName || specifier.startsWith(`${packageName}/`)))
    .sort(([left], [right]) => right.length - left.length)
    .map(([packageName, mappedPath]) => ({
      mappedPath,
      packageName,
      subpath: specifier === packageName ? '' : specifier.slice(packageName.length + 1),
    }))
    .at(0) ?? null;
}

function collectPackageExportCandidates(value: unknown, candidates: string[]): void {
  if (typeof value === 'string') {
    candidates.push(value);
    return;
  }

  if (!isPlainRecord(value)) {
    return;
  }

  for (const field of ['types', 'typings', 'import', 'require', 'node', 'default']) {
    collectPackageExportCandidates(value[field], candidates);
  }
}

function readPackageEntryCandidates(packageRoot: string, subpath: string): string[] {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath) || !fs.statSync(packageJsonPath).isFile()) {
    return [];
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as unknown;
    if (!isPlainRecord(packageJson)) {
      return [];
    }

    const candidates: string[] = [];
    const exportsField = packageJson.exports;
    const exportKey = subpath ? `./${subpath}` : '.';
    if (isPlainRecord(exportsField)) {
      collectPackageExportCandidates(exportsField[exportKey], candidates);
    }

    if (subpath.length === 0) {
      for (const field of ['types', 'typings', 'module', 'main']) {
        const value = packageJson[field];
        if (typeof value === 'string') {
          candidates.push(value);
        }
      }
    }

    return candidates.map(candidate => path.resolve(packageRoot, candidate));
  } catch {
    return [];
  }
}

function createFilePathCandidates(basePath: string): string[] {
  const candidates: string[] = [];

  for (const extension of IMPORT_RESOLUTION_EXTENSIONS) {
    candidates.push(`${basePath}${extension}`);
  }

  for (const extension of IMPORT_RESOLUTION_EXTENSIONS.slice(1)) {
    candidates.push(path.join(basePath, `index${extension}`));
  }

  return candidates;
}

function createMappedPathCandidates(
  workspaceRoot: string,
  match: MatchedMonorepoImport,
): string[] {
  const mappedBasePath = resolveConfiguredPath(workspaceRoot, match.mappedPath);
  const basePath = match.subpath
    ? path.join(mappedBasePath, match.subpath)
    : mappedBasePath;

  return [
    ...readPackageEntryCandidates(mappedBasePath, match.subpath),
    ...createFilePathCandidates(basePath),
  ];
}

export function resolveMonorepoImportMapTargetId(
  specifier: string,
  monorepoImportMap: MonorepoImportMap,
  fileConnections: ReadonlyMap<string, unknown>,
  workspaceRoot: string,
): string | null {
  const match = findMappedImport(specifier, monorepoImportMap);
  if (!match) {
    return null;
  }

  for (const candidate of createMappedPathCandidates(workspaceRoot, match)) {
    const targetRelative = toWorkspaceRelativePath(workspaceRoot, candidate);
    if (targetRelative && fileConnections.has(targetRelative)) {
      return targetRelative;
    }
  }

  return null;
}
