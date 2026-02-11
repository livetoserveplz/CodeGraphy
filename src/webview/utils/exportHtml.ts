/**
 * Generate a self-contained interactive HTML string for the graph.
 */
export function generateInteractiveHtml(
  nodes: Array<{ id: string; label?: string; color?: { background?: string; border?: string }; size?: number }>,
  edges: Array<{ from: string; to: string; color?: { color?: string } }>,
  positions: Record<string, { x: number; y: number }>
): string {
  const nodesJson = JSON.stringify(nodes.map(n => ({
    id: n.id,
    label: n.label || n.id,
    color: n.color,
    size: n.size || 16,
    x: positions[n.id]?.x ?? 0,
    y: positions[n.id]?.y ?? 0,
  })));

  const edgesJson = JSON.stringify(edges.map(e => ({
    from: e.from,
    to: e.to,
    color: e.color?.color || '#71717a',
    arrows: 'to',
  })));

  const scriptClose = '<' + '/script>';
  const scriptOpen = '<' + 'script>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CodeGraphy - Interactive Graph</title>
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js">${scriptClose}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #18181b; overflow: hidden; font-family: system-ui, sans-serif; }
  #graph { width: 100vw; height: 100vh; }
  #info { position: fixed; top: 12px; left: 12px; color: #a1a1aa; font-size: 13px;
    background: rgba(24,24,27,0.85); padding: 6px 12px; border-radius: 6px; pointer-events: none; }
</style>
</head>
<body>
<div id="graph"></div>
<div id="info">CodeGraphy &mdash; click a node to see its path</div>
${scriptOpen}
(function() {
  var nodes = new vis.DataSet(${nodesJson});
  var edges = new vis.DataSet(${edgesJson});
  var container = document.getElementById('graph');
  var data = { nodes: nodes, edges: edges };
  var options = {
    physics: { enabled: false },
    interaction: { hover: true, zoomView: true, dragView: true },
    nodes: {
      shape: 'dot',
      font: { color: '#fafafa', size: 12 }
    },
    edges: {
      smooth: { type: 'continuous' },
      arrows: { to: { enabled: true, scaleFactor: 0.5 } }
    }
  };
  var network = new vis.Network(container, data, options);
  network.on('click', function(params) {
    if (params.nodes.length > 0) {
      document.getElementById('info').textContent = params.nodes[0];
    }
  });
})();
${scriptClose}
</body>
</html>`;
}
