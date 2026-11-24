import { describe, expect, it } from 'vitest';

import { createLinuxSourceListening } from './create_linux_source_listening';
import { ListenSettings } from './listen_settings';
import { unloadLoopbacksNow } from './unload_loopbacks_now';

describe('unloadLoopbacksNow', () => {
	it('should unload every module with a short timeout', () => {
		const calls: Array<{ args: readonly string[]; timeout: number }> = [];

		unloadLoopbacksNow([4, 5], (_command, args, options) => {
			calls.push({ args, timeout: options.timeout });
		});

		expect(calls).toEqual([
			{
				args: ['unload-module', '4'],
				timeout: ListenSettings.exitUnloadTimeoutMilliseconds,
			},
			{
				args: ['unload-module', '5'],
				timeout: ListenSettings.exitUnloadTimeoutMilliseconds,
			},
		]);
	});

	it('should keep unloading the other modules and not throw when one unload fails', () => {
		const unloaded: string[] = [];

		expect(() => {
			unloadLoopbacksNow([4, 5, 6], (_command, args) => {
				if (args[1] === '5') {
					throw new Error('pactl failed');
				}
				unloaded.push(args[1] ?? '');
			});
		}).not.toThrow();
		expect(unloaded).toEqual(['4', '6']);
	});

	it('should be exposed by the adapter with the injected runner', () => {
		const unloaded: string[] = [];
		const listening = createLinuxSourceListening({
			runCommandSync: (_command, args) => {
				unloaded.push(args[1] ?? '');
			},
		});

		listening.unloadLoopbacksNow([7]);

		expect(unloaded).toEqual(['7']);
	});
});
