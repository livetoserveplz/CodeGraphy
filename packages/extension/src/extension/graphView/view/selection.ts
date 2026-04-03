import type { IGraphData } from '../../../shared/graph/types';
import type { IViewContext } from '../../../core/views/contracts';

interface GraphViewSelectionState {
  _activeViewId: string;
  _graphData: IGraphData;
  _viewContext: IViewContext;
}

interface GraphViewViewInfoLike {
  view: {
    id: string;
  };
}

interface ChangeGraphViewViewDependencies {
  isViewAvailable: (viewId: string, viewContext: IViewContext) => boolean;
  persistActiveViewId: (viewId: string) => Promise<void>;
  applyViewTransform: () => void;
  sendAvailableViews: () => void;
  sendMessage: (message: unknown) => void;
  logUnavailableView: (viewId: string) => void;
}

interface SetGraphViewFocusDependencies {
  getActiveViewInfo: (activeViewId: string) => GraphViewViewInfoLike | undefined;
  applyViewTransform: () => void;
  sendAvailableViews: () => void;
  sendMessage: (message: unknown) => void;
}

interface SetGraphViewDepthLimitDependencies {
  persistDepthLimit: (depthLimit: number) => Promise<void>;
  sendMessage: (message: unknown) => void;
  getActiveViewInfo: (activeViewId: string) => GraphViewViewInfoLike | undefined;
  applyViewTransform: () => void;
}

function isDepthGraphActive(
  activeViewId: string,
  getActiveViewInfo: (activeViewId: string) => GraphViewViewInfoLike | undefined,
): boolean {
  return getActiveViewInfo(activeViewId)?.view.id === 'codegraphy.depth-graph';
}

export async function changeGraphViewView(
  state: GraphViewSelectionState,
  viewId: string,
  {
    isViewAvailable,
    persistActiveViewId,
    applyViewTransform,
    sendAvailableViews,
    sendMessage,
    logUnavailableView,
  }: ChangeGraphViewViewDependencies,
): Promise<void> {
  if (!isViewAvailable(viewId, state._viewContext)) {
    logUnavailableView(viewId);
    return;
  }

  state._activeViewId = viewId;
  await persistActiveViewId(viewId);
  applyViewTransform();
  sendMessage({ type: 'GRAPH_DATA_UPDATED', payload: state._graphData });
  sendAvailableViews();
}

export function setGraphViewFocusedFile(
  state: GraphViewSelectionState,
  filePath: string | undefined,
  {
    getActiveViewInfo,
    applyViewTransform,
    sendAvailableViews,
    sendMessage,
  }: SetGraphViewFocusDependencies,
): void {
  const previousFocusedFile = state._viewContext.focusedFile;
  state._viewContext.focusedFile = filePath;
  const depthGraphActive = isDepthGraphActive(state._activeViewId, getActiveViewInfo);

  if (!depthGraphActive) {
    state._viewContext.maxDepthLimit = undefined;
  }

  if (depthGraphActive) {
    applyViewTransform();
    sendMessage({ type: 'GRAPH_DATA_UPDATED', payload: state._graphData });
  }

  if (previousFocusedFile !== filePath) {
    sendAvailableViews();
    sendMessage({
      type: 'ACTIVE_FILE_UPDATED',
      payload: { filePath },
    });
  }
}

export async function setGraphViewDepthLimit(
  state: GraphViewSelectionState,
  depthLimit: number,
  {
    persistDepthLimit,
    sendMessage,
    getActiveViewInfo,
    applyViewTransform,
  }: SetGraphViewDepthLimitDependencies,
): Promise<void> {
  const maxDepthLimit = state._viewContext.maxDepthLimit;
  const clampedDepthLimit = Math.max(1, Math.min(maxDepthLimit ?? Number.POSITIVE_INFINITY, depthLimit));
  state._viewContext.depthLimit = clampedDepthLimit;

  await persistDepthLimit(clampedDepthLimit);
  sendMessage({
    type: 'DEPTH_LIMIT_UPDATED',
    payload: { depthLimit: clampedDepthLimit, maxDepthLimit },
  });

  if (isDepthGraphActive(state._activeViewId, getActiveViewInfo)) {
    applyViewTransform();
    sendMessage({ type: 'GRAPH_DATA_UPDATED', payload: state._graphData });
  }
}

export function getGraphViewDepthLimit(
  viewContext: IViewContext,
  defaultDepthLimit: number,
): number {
  return viewContext.depthLimit ?? defaultDepthLimit;
}
