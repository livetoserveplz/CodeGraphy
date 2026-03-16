import type { IPluginContextMenuItem } from '../../../shared/types';
import type { GraphContextSelection } from './types';

export interface ClassifiedTarget {
  targetId: string;
  targetType: 'node' | 'edge';
  eligibleItems: IPluginContextMenuItem[];
}

export function classifyTarget(
  selection: GraphContextSelection,
  pluginItems: readonly IPluginContextMenuItem[]
): ClassifiedTarget | null {
  if (selection.kind === 'node' && selection.targets.length === 1) {
    return {
      targetId: selection.targets[0],
      targetType: 'node',
      eligibleItems: pluginItems.filter(item => item.when === 'node' || item.when === 'both'),
    };
  }

  if (selection.kind === 'edge' && selection.edgeId) {
    return {
      targetId: selection.edgeId,
      targetType: 'edge',
      eligibleItems: pluginItems.filter(item => item.when === 'edge' || item.when === 'both'),
    };
  }

  return null;
}
