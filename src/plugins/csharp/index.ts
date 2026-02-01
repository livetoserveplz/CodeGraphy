/**
 * @fileoverview C# plugin for CodeGraphy.
 * Detects using directives in C# files and resolves them to file paths.
 * @module plugins/csharp
 */

import { IPlugin, IConnection } from '../../core/plugins';
import { ImportDetector, IDetectedNamespace } from './ImportDetector';
import { PathResolver, ICSharpPathResolverConfig } from './PathResolver';

export { ImportDetector } from './ImportDetector';
export type { IDetectedUsing, IDetectedNamespace } from './ImportDetector';
export { PathResolver } from './PathResolver';
export type { ICSharpPathResolverConfig } from './PathResolver';

/**
 * Built-in plugin for C# files.
 * 
 * Uses regex-based parsing to detect C# using directives,
 * then resolves them to file paths using namespace conventions.
 * 
 * Supports:
 * - C# source files (.cs)
 * - Using directives (regular, static, global, alias)
 * - Namespace declarations for cross-file resolution
 * - Convention-based path mapping
 * 
 * @example
 * ```typescript
 * import { createCSharpPlugin } from './plugins/csharp';
 * 
 * const plugin = createCSharpPlugin();
 * registry.register(plugin, { builtIn: true });
 * ```
 */
export function createCSharpPlugin(): IPlugin {
  let resolver: PathResolver | null = null;
  let detector: ImportDetector | null = null;
  let namespaceRegistry: Map<string, IDetectedNamespace[]> = new Map();

  return {
    id: 'codegraphy.csharp',
    name: 'C#',
    version: '1.0.0',
    supportedExtensions: ['.cs'],
    
    // Default excludes for C# projects
    defaultExcludes: [
      'bin',
      'obj',
      '.vs',
      'packages',
      'TestResults',
      '*.Designer.cs',
      '*.generated.cs',
      'AssemblyInfo.cs',
    ],
    
    // Plugin-preferred colors for C# files
    fileColors: {
      '.cs': '#512BD4',           // C# purple
      '.csx': '#512BD4',          // C# script
      '.csproj': '#512BD4',       // Project file
      '.sln': '#854CC7',          // Solution file - lighter purple
      '.props': '#6B7280',        // MSBuild props
      '.targets': '#6B7280',      // MSBuild targets
      'Directory.Build.props': '#6B7280',
      'Directory.Build.targets': '#6B7280',
      'global.json': '#512BD4',
      'nuget.config': '#004880',  // NuGet blue
      '.editorconfig': '#6B7280',
      'appsettings.json': '#F7DF1E', // JSON yellow
      'appsettings.Development.json': '#F7DF1E',
      'launchSettings.json': '#F7DF1E',
    },

    async initialize(workspaceRoot: string): Promise<void> {
      detector = new ImportDetector();
      
      // Load project config if available
      const config = await loadCSharpConfig(workspaceRoot);
      resolver = new PathResolver(workspaceRoot, config);
      namespaceRegistry = new Map();
      
      console.log('[CodeGraphy] C# plugin initialized');
    },

    async detectConnections(
      filePath: string,
      content: string,
      workspaceRoot: string
    ): Promise<IConnection[]> {
      if (!detector || !resolver) {
        detector = new ImportDetector();
        const config = await loadCSharpConfig(workspaceRoot);
        resolver = new PathResolver(workspaceRoot, config);
      }

      const { usings, namespaces } = detector.detect(content, filePath);
      
      // Register namespaces from this file for cross-file resolution
      for (const ns of namespaces) {
        resolver.registerNamespace(ns, filePath);
        
        if (!namespaceRegistry.has(filePath)) {
          namespaceRegistry.set(filePath, []);
        }
        namespaceRegistry.get(filePath)!.push(ns);
      }
      
      const connections: IConnection[] = [];

      for (const using of usings) {
        const resolvedPath = resolver.resolve(using, filePath);
        
        // Build specifier string
        let specifier = using.namespace;
        if (using.isGlobal) specifier = `global using ${specifier}`;
        else if (using.isStatic) specifier = `using static ${specifier}`;
        else if (using.alias) specifier = `using ${using.alias} = ${specifier}`;
        else specifier = `using ${specifier}`;
        
        connections.push({
          specifier,
          resolvedPath,
          type: 'static',
        });
      }

      return connections;
    },

    dispose(): void {
      resolver = null;
      detector = null;
      namespaceRegistry.clear();
    },
  };
}

/**
 * Loads C# project configuration.
 * Attempts to find root namespace from .csproj files.
 */
async function loadCSharpConfig(_workspaceRoot: string): Promise<ICSharpPathResolverConfig> {
  // For now, use default config
  // Future: parse .csproj for RootNamespace
  return {
    sourceDirs: ['', 'src'],
  };
}

// Default export for convenience
export default createCSharpPlugin;
