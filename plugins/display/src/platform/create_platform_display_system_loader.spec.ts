import { describe, expect, it } from 'vitest';

import { createPlatformDisplaySystemLoader } from './create_platform_display_system_loader';

describe('createPlatformDisplaySystemLoader', () => {
	it('should reject with an UnsupportedPlatformError on another operating system', async () => {
		const load = createPlatformDisplaySystemLoader({
			platform: 'darwin',
			schedule: () => () => undefined,
		});

		await expect(load()).rejects.toMatchObject({
			code: 'E_UNSUPPORTED_PLATFORM',
		});
	});

	it('should load the Linux adapter on linux', async () => {
		const load = createPlatformDisplaySystemLoader({
			platform: 'linux',
			schedule: () => () => undefined,
		});

		const system = await load();

		expect(system.canBlackScreen).toBe(false);
	});
});
