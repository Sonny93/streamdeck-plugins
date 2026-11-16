import { describe, expect, it } from 'vitest';

import { resolveOpenDeckPluginsDirectory } from './resolve_opendeck_plugins_directory.ts';

describe('resolveOpenDeckPluginsDirectory', () => {
	it('should use XDG_CONFIG_HOME when it is set', () => {
		expect(
			resolveOpenDeckPluginsDirectory({
				xdgConfigHome: '/xdg',
				homeDirectory: '/home/someone',
			})
		).toBe('/xdg/opendeck/plugins');
	});

	it('should fall back to the home config folder when XDG_CONFIG_HOME is unset', () => {
		expect(
			resolveOpenDeckPluginsDirectory({
				xdgConfigHome: undefined,
				homeDirectory: '/home/someone',
			})
		).toBe('/home/someone/.config/opendeck/plugins');
	});
});
