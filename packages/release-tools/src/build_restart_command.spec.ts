import { describe, expect, it } from 'vitest';

import { buildRestartCommand } from './build_restart_command.ts';

describe('buildRestartCommand', () => {
	it('should run the plugin powershell script on win32', () => {
		expect(
			buildRestartCommand({
				platform: 'win32',
				pluginUuid: 'com.sonny93.audio',
			})
		).toEqual({
			command: 'powershell',
			args: [
				'-NoProfile',
				'-ExecutionPolicy',
				'Bypass',
				'-File',
				'scripts/restart_plugin.ps1',
			],
		});
	});

	it('should reload the plugin through opendeck on linux', () => {
		expect(
			buildRestartCommand({
				platform: 'linux',
				pluginUuid: 'com.sonny93.audio',
			})
		).toEqual({
			command: 'opendeck',
			args: ['--reload-plugin', 'com.sonny93.audio.sdPlugin'],
		});
	});

	it('should return undefined on other platforms', () => {
		expect(
			buildRestartCommand({
				platform: 'darwin',
				pluginUuid: 'com.sonny93.audio',
			})
		).toBeUndefined();
	});
});
