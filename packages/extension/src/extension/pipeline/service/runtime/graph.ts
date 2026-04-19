import type * as vscode from 'vscode';
import type { IFileAnalysisResult, IProjectedConnection } from '../../../../core/plugins/types/contracts';
import type { PluginRegistry } from '../../../../core/plugins/registry/manager';
import type { IGraphData } from '../../../../shared/graph/contracts';
import type { IWorkspaceAnalysisCache } from '../../cache';
import type { MonorepoImportMap } from '../../graph/monorepoImportMap/resolve';
import { projectConnectionMapFromFileAnalysis } from '../../projection';
import { buildWorkspacePipelineGraphData } from '../../serviceAdapters';

export function buildWorkspacePipelineGraph(
  cache: IWorkspaceAnalysisCache,
  context: vscode.ExtensionContext,
  registry: PluginRegistry,
  fileConnections: Map<string, IProjectedConnection[]>,
  workspaceRoot: string,
  showOrphans: boolean,
  disabledPlugins: Set<string>,
  monorepoImportMap: MonorepoImportMap = {},
): IGraphData {
  return buildWorkspacePipelineGraphData(
    cache,
    context,
    registry,
    fileConnections,
    workspaceRoot,
    showOrphans,
    disabledPlugins,
    monorepoImportMap,
  );
}

export function buildWorkspacePipelineGraphFromAnalysis(
  cache: IWorkspaceAnalysisCache,
  context: vscode.ExtensionContext,
  registry: PluginRegistry,
  fileAnalysis: Map<string, IFileAnalysisResult>,
  workspaceRoot: string,
  showOrphans: boolean,
  disabledPlugins: Set<string>,
  monorepoImportMap: MonorepoImportMap = {},
): IGraphData {
  return buildWorkspacePipelineGraph(
    cache,
    context,
    registry,
    projectConnectionMapFromFileAnalysis(fileAnalysis),
    workspaceRoot,
    showOrphans,
    disabledPlugins,
    monorepoImportMap,
  );
}
