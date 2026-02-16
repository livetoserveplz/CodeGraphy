# RFC: AI Agent Graph API

- **Issue:** #57
- **Status:** Proposed
- **Owner:** @livetoserveplz
- **Last updated:** 2026-02-16

## Problem

AI coding agents repeatedly rebuild architecture context by parsing files from scratch. CodeGraphy already computes a dependency graph with useful derived insights, but there is no stable machine-facing API.

## Goals

1. Expose graph data through a stable, versioned contract.
2. Support both in-editor workflows and external agent tooling.
3. Keep data fresh with low overhead.
4. Add safe defaults for path privacy and payload size.

## Non-goals

- Running arbitrary code on behalf of agents.
- Building a full chat assistant inside CodeGraphy in this phase.

## Proposed interfaces

### 1) VS Code command API (first ship)

Commands return JSON-serializable objects and are callable by other extensions/automation.

- `codegraphy.api.getConnections(filePath)`
- `codegraphy.api.getDependencyTree(filePath, depth?)`
- `codegraphy.api.findPath(from, to)`
- `codegraphy.api.getOrphans()`
- `codegraphy.api.getGraphSnapshot(options?)`
- `codegraphy.api.getArchitectureSummary(options?)`

### 2) Snapshot export

A deterministic JSON snapshot written to workspace (opt-in):

- `.codegraphy/snapshot.v1.json`
- Updated on analyze or via command

### 3) MCP adapter (phase 2)

Provide MCP tools backed by the same service contract:

- `get_file_dependencies`
- `get_dependents`
- `find_related_files`
- `get_architecture_summary`

## API schema (v1)

```json
{
  "version": "1.0",
  "workspaceRoot": "<redacted-or-relative>",
  "generatedAt": "2026-02-16T17:00:00.000Z",
  "nodes": [{ "id": "src/app.ts", "label": "app.ts", "ext": ".ts" }],
  "edges": [{ "from": "src/app.ts", "to": "src/core/x.ts", "type": "static" }],
  "insights": {
    "entryPoints": ["src/app.ts"],
    "orphans": [],
    "hubs": [{ "id": "src/core/x.ts", "degree": 12 }],
    "cycles": []
  }
}
```

## Freshness model

- Analyzer emits a monotonically increasing `graphRevision`.
- API responses include `graphRevision` and `generatedAt`.
- Consumers can pass `minRevision`; if stale, extension recomputes before returning.

## Safety + privacy

- Default to workspace-relative paths.
- Optional absolute paths via explicit setting.
- Max node/edge limits for command responses with truncation metadata.
- No file contents in v1 responses.

## Integration with plugin RFC (#56)

This API should consume data-provider plugin outputs when available:

- Core snapshot includes `providers` map.
- Providers can append metrics/annotations for agents.

## Rollout plan

### Phase 1 (MVP)
- Internal graph query service in extension layer.
- VS Code command API for connections/tree/path/summary.
- JSON snapshot export command.

### Phase 2
- MCP adapter process using same query service.
- Structured tool docs + examples for Claude/Copilot/OpenAI workflows.

### Phase 3
- Optional natural-language query layer using deterministic query planner.

## Acceptance criteria

- [ ] Commands exist and return typed JSON
- [ ] Snapshot export command writes valid `snapshot.v1.json`
- [ ] Responses include revision/freshness metadata
- [ ] Relative path mode is default
- [ ] Unit tests for query service + command handlers

## Decision

Ship the VS Code command API and snapshot export first, then layer MCP on top of the same contract to avoid duplicate logic.