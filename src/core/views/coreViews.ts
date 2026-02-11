/**
 * @fileoverview Core views that ship with CodeGraphy.
 * These views are always available regardless of which plugins are active.
 * @module core/views/coreViews
 */

import { IView, IViewContext } from './types';
import { IGraphData } from '../../shared/types';

/**
 * Connections view - the default view.
 * Shows all files and their import relationships.
 * This is the current default behavior of CodeGraphy.
 */
export const connectionsView: IView = {
  id: 'codegraphy.connections',
  name: 'Connections',
  icon: 'symbol-file',
  description: 'Shows all files and their import relationships',
  
  transform(data: IGraphData, _context: IViewContext): IGraphData {
    // Pass through - this is the default view that shows everything
    return data;
  },
};

/**
 * Depth Graph view - focuses on a specific file.
 * Shows the selected file and connections radiating outward up to N levels deep.
 * 
 * Uses BFS traversal to find all nodes within the depth limit.
 * Nodes are annotated with their depth level for visual styling.
 */
export const depthGraphView: IView = {
  id: 'codegraphy.depth-graph',
  name: 'Depth Graph',
  icon: 'target',
  description: 'Focus on current file and its connections up to N levels deep',
  
  transform(data: IGraphData, context: IViewContext): IGraphData {
    // If no file is focused, return empty graph
    if (!context.focusedFile) {
      return { nodes: [], edges: [] };
    }
    
    const focusedFile = context.focusedFile;
    const depthLimit = context.depthLimit ?? 1;
    
    // Build adjacency list for both directions (imports and imported-by)
    const adjacencyList = new Map<string, Set<string>>();
    
    for (const node of data.nodes) {
      adjacencyList.set(node.id, new Set());
    }
    
    for (const edge of data.edges) {
      // Add both directions for undirected traversal
      adjacencyList.get(edge.from)?.add(edge.to);
      adjacencyList.get(edge.to)?.add(edge.from);
    }
    
    // BFS to find all nodes within depth limit
    const nodeDepths = new Map<string, number>();
    const queue: Array<{ nodeId: string; depth: number }> = [];
    
    // Start from the focused file
    if (adjacencyList.has(focusedFile)) {
      nodeDepths.set(focusedFile, 0);
      queue.push({ nodeId: focusedFile, depth: 0 });
    }
    
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      // Don't explore beyond depth limit
      if (depth >= depthLimit) continue;
      
      const neighbors = adjacencyList.get(nodeId);
      if (!neighbors) continue;
      
      for (const neighbor of neighbors) {
        if (!nodeDepths.has(neighbor)) {
          nodeDepths.set(neighbor, depth + 1);
          queue.push({ nodeId: neighbor, depth: depth + 1 });
        }
      }
    }
    
    // Filter nodes and annotate with depth level
    const filteredNodes = data.nodes
      .filter(node => nodeDepths.has(node.id))
      .map(node => ({
        ...node,
        depthLevel: nodeDepths.get(node.id),
      }));
    
    // Filter edges to only include those between included nodes
    const includedNodeIds = new Set(nodeDepths.keys());
    const filteredEdges = data.edges.filter(
      edge => includedNodeIds.has(edge.from) && includedNodeIds.has(edge.to)
    );
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      nodeSizeMode: data.nodeSizeMode,
    };
  },
  
  isAvailable(context: IViewContext): boolean {
    // Only available when a file is focused
    return context.focusedFile !== undefined;
  },
};

/**
 * Subfolder View - limits the graph to a specific folder.
 * Shows only files within the selected folder and its subfolders.
 * 
 * This is a placeholder implementation.
 */
export const subfolderView: IView = {
  id: 'codegraphy.subfolder',
  name: 'Subfolder View',
  icon: 'folder',
  description: 'Limit view to files in a specific folder',
  
  transform(data: IGraphData, context: IViewContext): IGraphData {
    // If no folder is selected, return everything
    if (!context.selectedFolder) {
      return data;
    }
    
    const folderPrefix = context.selectedFolder.endsWith('/')
      ? context.selectedFolder
      : `${context.selectedFolder}/`;
    
    // Filter nodes to only include those in the folder
    const filteredNodes = data.nodes.filter(
      node => node.id.startsWith(folderPrefix) || node.id === context.selectedFolder
    );
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    // Filter edges to only include those between filtered nodes
    const filteredEdges = data.edges.filter(
      edge => nodeIds.has(edge.from) && nodeIds.has(edge.to)
    );
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      nodeSizeMode: data.nodeSizeMode,
    };
  },
  
  isAvailable(context: IViewContext): boolean {
    // Only available when a folder is selected
    return context.selectedFolder !== undefined;
  },
};

/**
 * Folder View - shows the project's directory structure as a tree graph.
 * Creates folder nodes and edges representing the file system hierarchy
 * instead of import/dependency connections.
 */
export const folderView: IView = {
  id: 'codegraphy.folder',
  name: 'Folder View',
  icon: 'folder',
  description: 'Shows the project directory structure as a hierarchical tree',

  transform(data: IGraphData, _context: IViewContext): IGraphData {
    const folderSet = new Set<string>();
    const fileFolderMap = new Map<string, string>();

    for (const node of data.nodes) {
      const lastSlash = node.id.lastIndexOf('/');
      if (lastSlash === -1) {
        fileFolderMap.set(node.id, '.');
        folderSet.add('.');
      } else {
        const parentFolder = node.id.substring(0, lastSlash);
        fileFolderMap.set(node.id, parentFolder);

        let current = parentFolder;
        while (current) {
          folderSet.add(current);
          const slash = current.lastIndexOf('/');
          if (slash === -1) {
            folderSet.add('.');
            break;
          }
          current = current.substring(0, slash);
        }
      }
    }

    const fileCountMap = new Map<string, number>();
    for (const folder of fileFolderMap.values()) {
      fileCountMap.set(folder, (fileCountMap.get(folder) ?? 0) + 1);
    }

    const folderNodes: IGraphData['nodes'] = [];
    for (const folder of folderSet) {
      const label = folder === '.' ? '.' : folder.substring(folder.lastIndexOf('/') + 1);
      folderNodes.push({
        id: folder,
        label,
        color: '#A1A1AA',
        isFolder: true,
        fileCount: fileCountMap.get(folder) ?? 0,
      });
    }

    const fileNodes = data.nodes.map(n => ({ ...n }));

    const edges: IGraphData['edges'] = [];
    for (const folder of folderSet) {
      if (folder === '.') continue;
      const slash = folder.lastIndexOf('/');
      const parent = slash === -1 ? '.' : folder.substring(0, slash);
      edges.push({
        id: `${parent}->${folder}`,
        from: parent,
        to: folder,
      });
    }

    for (const [fileId, parentFolder] of fileFolderMap) {
      edges.push({
        id: `${parentFolder}->${fileId}`,
        from: parentFolder,
        to: fileId,
      });
    }

    return {
      nodes: [...folderNodes, ...fileNodes],
      edges,
      nodeSizeMode: data.nodeSizeMode,
    };
  },
};

/**
 * All core views that ship with CodeGraphy.
 * Register these on startup.
 */
export const coreViews: IView[] = [
  connectionsView,
  depthGraphView,
  subfolderView,
  folderView,
];
