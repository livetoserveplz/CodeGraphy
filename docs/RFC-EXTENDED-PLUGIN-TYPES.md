# RFC: Extended Plugin Types

- **Issue:** #56
- **Status:** Proposed
- **Owner:** @livetoserveplz
- **Last updated:** 2026-02-16

## Problem

CodeGraphy plugins currently have one capability: detect file-to-file connections.
That keeps the core clean, but blocks high-value features like overlays (coverage, blame), non-visual analysis (cycle detection), and machine-consumable exports.

## Goals

1. Add a capability-based plugin model without breaking existing language plugins.
2. Support overlays and metrics as first-class extension points.
3. Allow data-provider plugins for external consumers (CLI/AI/export).
4. Keep performance predictable when multiple plugins are active.

## Non-goals

- Full plugin marketplace security model in this RFC.
- Dynamic remote plugin execution.
- Replacing existing language plugin API in one release.

## Proposal

Introduce capability interfaces on top of the existing language plugin contract.

```ts
export interface ICodeGraphyPluginBase {
  id: string;
  name: string;
  version: string;
}

export interface ILanguagePlugin extends ICodeGraphyPluginBase {
  kind: 'language';
  supportedExtensions: string[];
  detectConnections(filePath: string, content: string, workspaceRoot: string): Promise<IConnection[]>;
}

export interface IOverlayPlugin extends ICodeGraphyPluginBase {
  kind: 'overlay';
  overlayId: string;
  // optional settings schema for UI generation
  getSettingsSchema?(): Record<string, unknown>;
  // returns per-node decoration and optional tooltip fragments
  computeOverlay(graph: GraphData, ctx: PluginContext): Promise<OverlayResult>;
}

export interface IMetricPlugin extends ICodeGraphyPluginBase {
  kind: 'metric';
  metricId: string;
  computeMetrics(graph: GraphData, ctx: PluginContext): Promise<MetricResult>;
}

export interface IDataProviderPlugin extends ICodeGraphyPluginBase {
  kind: 'data-provider';
  providerId: string;
  getSnapshot(graph: GraphData, ctx: PluginContext): Promise<Record<string, unknown>>;
}
```

## Rendering model for overlays

- Core graph data remains immutable input.
- Overlay plugins return additive decorations:
  - `nodeStyleById`
  - `edgeStyleById`
  - `tooltipFragmentsByNodeId`
- Webview composes base styles + active overlay styles.
- Overlay toggle lives in extension settings and gear menu.

## Conflict resolution

When multiple overlays are active:

1. Core style is base
2. Overlays apply by priority (lower number first)
3. Last write wins per style property
4. Tooltip content concatenates in overlay priority order

This makes behavior deterministic and debuggable.

## Performance budget

- Each plugin gets a soft execution budget (default 100ms for incremental update, 500ms for full recompute).
- Over-budget plugins are logged and temporarily throttled.
- Cached plugin outputs keyed by graph hash + plugin settings hash.

## Migration plan

### Phase A (non-breaking)
- Keep current `ILanguagePlugin` API untouched.
- Add new plugin interfaces + registry routing.
- Add telemetry/logging around plugin timing.

### Phase B
- Add one built-in overlay plugin as reference implementation (coverage).
- Add one built-in metric plugin (cycle detection).

### Phase C
- Add data provider endpoint integration for AI/CLI (see #57 RFC).

## Open questions

1. Should overlay plugins be able to contribute panel UI, or only settings and tooltip fragments?
2. Do we need explicit dependency ordering between plugins?
3. Should plugin execution move to worker threads for very large graphs?

## Initial implementation checklist

- [ ] Add `kind` + capability types in `src/core/plugins/types.ts`
- [ ] Extend registry to store plugins by capability
- [ ] Add overlay computation pipeline in analyzer
- [ ] Add webview overlay composition layer
- [ ] Add perf instrumentation and cache keys
- [ ] Ship one built-in overlay + tests

## Decision

Proceed with Phase A and B in separate PRs, with coverage overlay as first proving ground.