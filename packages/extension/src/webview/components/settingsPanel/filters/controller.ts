import { useState } from 'react';
import { postMessage } from '../../../vscodeApi';
import { useGraphStore } from '../../../store/state';
import { addFilterPattern, deleteFilterPattern } from './patternActions';

export type FilterController = {
  filterPatterns: string[];
  newFilterPattern: string;
  onAddPattern: () => void;
  onDeletePattern: (pattern: string) => void;
  onPatternChange: (pattern: string) => void;
  onShowOrphansChange: (checked: boolean) => void;
  pluginFilterPatterns: string[];
  showOrphans: boolean;
};

export function useFilterController(): FilterController {
  const filterPatterns = useGraphStore((state) => state.filterPatterns);
  const pluginFilterPatterns = useGraphStore((state) => state.pluginFilterPatterns);
  const setFilterPatterns = useGraphStore((state) => state.setFilterPatterns);
  const setShowOrphans = useGraphStore((state) => state.setShowOrphans);
  const showOrphans = useGraphStore((state) => state.showOrphans);
  const [newFilterPattern, setNewFilterPattern] = useState('');

  return {
    filterPatterns,
    newFilterPattern,
    onAddPattern: () => {
      addFilterPattern(filterPatterns, newFilterPattern, setFilterPatterns, setNewFilterPattern);
    },
    onDeletePattern: (pattern: string) => {
      deleteFilterPattern(filterPatterns, pattern, setFilterPatterns);
    },
    onPatternChange: setNewFilterPattern,
    onShowOrphansChange: (checked: boolean) => {
      setShowOrphans(checked);
      postMessage({ type: 'UPDATE_SHOW_ORPHANS', payload: { showOrphans: checked } });
    },
    pluginFilterPatterns,
    showOrphans,
  };
}
