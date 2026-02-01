/**
 * @fileoverview Resolves C# namespace references to file paths.
 * Uses convention-based mapping since C# doesn't have direct file imports.
 * @module plugins/csharp/PathResolver
 */

import * as path from 'path';
import * as fs from 'fs';
import { IDetectedUsing, IDetectedNamespace } from './ImportDetector';

/**
 * Configuration for C# path resolution.
 */
export interface ICSharpPathResolverConfig {
  /** Root namespace of the project (often matches project name) */
  rootNamespace?: string;
  /** Additional source directories to search */
  sourceDirs?: string[];
}

/**
 * Resolves C# namespaces to file system paths.
 * 
 * C# namespace resolution is convention-based:
 * - Namespace parts typically map to directory structure
 * - `MyProject.Services.UserService` → `Services/UserService.cs`
 * 
 * This resolver:
 * 1. Strips the root namespace prefix (if configured)
 * 2. Converts remaining parts to a directory path
 * 3. Searches for matching .cs files
 * 
 * @example
 * ```typescript
 * const resolver = new PathResolver('/workspace', { rootNamespace: 'MyApp' });
 * 
 * // MyApp.Services → Services/
 * resolver.resolve({ namespace: 'MyApp.Services', ... }, 'Program.cs');
 * ```
 */
export class PathResolver {
  private _workspaceRoot: string;
  private _config: ICSharpPathResolverConfig;
  private _namespaceToFileMap: Map<string, string> = new Map();

  constructor(workspaceRoot: string, config: ICSharpPathResolverConfig = {}) {
    this._workspaceRoot = workspaceRoot;
    this._config = {
      rootNamespace: config.rootNamespace,
      sourceDirs: config.sourceDirs || [''],
    };
  }

  /**
   * Registers a namespace declaration from a file.
   * This builds the namespace → file mapping for resolution.
   */
  registerNamespace(ns: IDetectedNamespace, filePath: string): void {
    // Normalize to workspace-relative
    const relativePath = filePath.startsWith(this._workspaceRoot)
      ? path.relative(this._workspaceRoot, filePath)
      : filePath;
    
    this._namespaceToFileMap.set(ns.name, relativePath.replace(/\\/g, '/'));
  }

  /**
   * Resolves a using directive to an absolute file path.
   * 
   * @param using - The detected using directive
   * @param fromFile - The file containing the using (for relative resolution)
   * @returns The resolved absolute path or null if external/unresolved
   */
  resolve(using: IDetectedUsing, _fromFile: string): string | null {
    const namespace = using.namespace;
    
    // Check if we have an exact namespace match from registered files
    if (this._namespaceToFileMap.has(namespace)) {
      const relativePath = this._namespaceToFileMap.get(namespace)!;
      return path.join(this._workspaceRoot, relativePath).replace(/\\/g, '/');
    }
    
    // Try to find a file that might contain this namespace
    // Convention: namespace parts map to directory structure
    const possiblePath = this._conventionBasedResolve(namespace);
    if (possiblePath) {
      return path.join(this._workspaceRoot, possiblePath).replace(/\\/g, '/');
    }
    
    // Check if it's a System or third-party namespace (external)
    if (this._isExternalNamespace(namespace)) {
      return null;
    }
    
    return null;
  }

  /**
   * Attempts convention-based resolution.
   * Strips root namespace and converts to path.
   */
  private _conventionBasedResolve(namespace: string): string | null {
    let parts = namespace.split('.');
    
    // Strip root namespace if configured
    if (this._config.rootNamespace) {
      const rootParts = this._config.rootNamespace.split('.');
      if (parts.slice(0, rootParts.length).join('.') === this._config.rootNamespace) {
        parts = parts.slice(rootParts.length);
      }
    }
    
    if (parts.length === 0) return null;
    
    // Try each source directory
    for (const srcDir of this._config.sourceDirs || ['']) {
      // Try as directory with matching .cs file
      // e.g., Services.UserService → Services/UserService.cs
      const dirPath = parts.slice(0, -1).join('/');
      const fileName = parts[parts.length - 1] + '.cs';
      const fullPath = srcDir ? path.join(srcDir, dirPath, fileName) : path.join(dirPath, fileName);
      
      if (this._fileExists(fullPath)) {
        return fullPath.replace(/\\/g, '/');
      }
      
      // Try as namespace folder with any .cs files
      const nsPath = parts.join('/');
      const asDir = srcDir ? path.join(srcDir, nsPath) : nsPath;
      
      // Check for directory with .cs files
      if (this._directoryExists(asDir)) {
        // Return the first .cs file in the directory
        const csFile = this._findCsFileInDir(asDir);
        if (csFile) {
          return csFile.replace(/\\/g, '/');
        }
      }
    }
    
    return null;
  }

  /**
   * Checks if a namespace is external (System, NuGet, etc.)
   */
  private _isExternalNamespace(namespace: string): boolean {
    const externalPrefixes = [
      'System',
      'Microsoft',
      'Newtonsoft',
      'NUnit',
      'Xunit',
      'Moq',
      'AutoMapper',
      'FluentValidation',
      'Serilog',
      'MediatR',
      'Dapper',
    ];
    
    return externalPrefixes.some(prefix => 
      namespace === prefix || namespace.startsWith(prefix + '.')
    );
  }

  /**
   * Checks if a file exists in the workspace.
   */
  private _fileExists(relativePath: string): boolean {
    try {
      const fullPath = path.join(this._workspaceRoot, relativePath);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a directory exists in the workspace.
   */
  private _directoryExists(relativePath: string): boolean {
    try {
      const fullPath = path.join(this._workspaceRoot, relativePath);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Finds the first .cs file in a directory.
   */
  private _findCsFileInDir(relativePath: string): string | null {
    try {
      const fullPath = path.join(this._workspaceRoot, relativePath);
      const files = fs.readdirSync(fullPath);
      const csFile = files.find(f => f.endsWith('.cs'));
      if (csFile) {
        return path.join(relativePath, csFile);
      }
    } catch {
      // Directory doesn't exist or not readable
    }
    return null;
  }
}
