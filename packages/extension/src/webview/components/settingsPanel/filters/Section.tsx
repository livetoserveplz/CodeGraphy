import React from 'react';
import { useFilterController } from './controller';
import { OrphansToggle } from './OrphansToggle';
import { Patterns } from './Patterns';

export function FilterSection(): React.ReactElement {
  const controller = useFilterController();

  return (
    <div className="mb-2 space-y-2">
      <OrphansToggle
        onCheckedChange={controller.onShowOrphansChange}
        showOrphans={controller.showOrphans}
      />

      <Patterns
        filterPatterns={controller.filterPatterns}
        newFilterPattern={controller.newFilterPattern}
        onAdd={controller.onAddPattern}
        onDelete={controller.onDeletePattern}
        onPatternChange={controller.onPatternChange}
        pluginFilterPatterns={controller.pluginFilterPatterns}
      />
    </div>
  );
}
