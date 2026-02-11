/**
 * @fileoverview Generate self-contained interactive HTML from graph data.
 * Uses vis-network loaded from CDN for pan/zoom/click interactivity.
 * @module webview/utils/exportHtml
 */

interface ExportNode {
  id: string;
  label: string;
  color?: string | { background?: string; border?: string };
  size?: number;
  shape?: string;
}

interface ExportEdge {
  from: string;
  to: string;
  color?: string | { color?: string };
}

/**
 * Generates a self-contained HTML string with an interactive vis-network graph.
 *
 * @param nodes - Array of node objects with id, label, color, size
 * @param edges - Array of edge objects with from, to
 * @returns Complete HTML document as a string
 */
export function generateInteractiveHtml(nodes: ExportNode[], edges: ExportEdge[]): string {
  const nodesJson = JSON.stringify(nodes);
  const edgesJson = JSON.stringify(edges);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeGraphy Export</title>
  <script src="https://unpkg.com/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1e1e1e; color: #ccc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #graph { width: 100vw; height: 100vh; }
    #info { position: fixed; top: 12px; left: 12px; background: rgba(30,30,30,0.9); padding: 8px 14px; border-radius: 6px; font-size: 13px; z-index: 10; }
  </style>
</head>
<body>
  <div id="info">CodeGraphy &mdash; ${nodes.length} nodes, ${edges.length} edges</div>
  <div id="graph"></div>
  <script>
    var nodes = new vis.DataSet(${nodesJson});
    var edges = new vis.DataSet(${edgesJson});
    var container = document.getElementById('graph');
    var network = new vis.Network(container, { nodes: nodes, edges: edges }, {
      physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -80 } },
      interaction: { hover: true, tooltipDelay: 200 },
      edges: { arrows: { to: { enabled: true, scaleFactor: 0.5 } }, color: { color: '#555', highlight: '#888' } },
      nodes: { font: { color: '#ccc', size: 12 }, borderWidth: 2 }
    });
    network.on('doubleClick', function(params) {
      if (params.nodes.length > 0) { network.focus(params.nodes[0], { scale: 1.5, animation: true }); }
    });
  </script>
</body>
</html>`;
}
