import { describe, expect, it, vi } from 'vitest';
import {
  activateInstalledCodeGraphyPlugins,
  getInstalledCodeGraphyPluginExtensions,
} from '../../../src/extension/pluginActivation/installed';

describe('extension/pluginActivation/installed', () => {
  it('selects installed extensions that depend on the core extension', () => {
    const extensions = [
      {
        id: 'codegraphy.codegraphy',
        isActive: true,
        packageJSON: { extensionDependencies: [] },
        activate: vi.fn(),
      },
      {
        id: 'codegraphy.codegraphy-typescript',
        isActive: false,
        packageJSON: { extensionDependencies: ['codegraphy.codegraphy'] },
        activate: vi.fn(),
      },
      {
        id: 'someone.else',
        isActive: false,
        packageJSON: { extensionDependencies: ['other.extension'] },
        activate: vi.fn(),
      },
    ];

    expect(getInstalledCodeGraphyPluginExtensions(extensions, 'codegraphy.codegraphy')).toEqual([
      extensions[1],
    ]);
  });

  it('activates installed dependent extensions and skips active ones', async () => {
    const inactiveActivate = vi.fn(async () => undefined);
    const activeActivate = vi.fn(async () => undefined);

    await activateInstalledCodeGraphyPlugins(
      [
        {
          id: 'codegraphy.codegraphy-typescript',
          isActive: false,
          packageJSON: { extensionDependencies: ['codegraphy.codegraphy'] },
          activate: inactiveActivate,
        },
        {
          id: 'codegraphy.codegraphy-godot',
          isActive: true,
          packageJSON: { extensionDependencies: ['codegraphy.codegraphy'] },
          activate: activeActivate,
        },
      ] as never,
      'codegraphy.codegraphy',
    );

    expect(inactiveActivate).toHaveBeenCalledOnce();
    expect(activeActivate).not.toHaveBeenCalled();
  });
});
