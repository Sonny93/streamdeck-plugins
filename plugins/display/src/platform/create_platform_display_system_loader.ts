import { onceAsync } from 'deck-kit/async/once_async';
import type { Scheduler } from 'deck-kit/async/scheduler';

import type { DisplaySystem } from '../displays/display_system';
import { UnsupportedPlatformError } from './unsupported_platform_error';

/**
 * Loads the monitor adapter of the operating system on first use.
 * The adapters are imported lazily, so Linux never loads the Windows bindings and Windows never loads the Linux ones.
 */
export function createPlatformDisplaySystemLoader(
	options: Readonly<{ platform: string; schedule: Scheduler }>
): () => Promise<DisplaySystem> {
	return onceAsync(async () => {
		switch (options.platform) {
			case 'win32': {
				const { createDisplaySystemLoader } = await import('./windows');
				return createDisplaySystemLoader(options.schedule)();
			}
			case 'linux': {
				const { createDisplaySystemLoader } = await import('./linux');
				return createDisplaySystemLoader()();
			}
			default:
				throw new UnsupportedPlatformError({ platform: options.platform });
		}
	});
}
