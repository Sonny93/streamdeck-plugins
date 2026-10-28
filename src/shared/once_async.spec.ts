import { describe, expect, it, vi } from 'vitest';

import { onceAsync } from './once_async';

describe('onceAsync', () => {
	it('runs the loader once and shares its result', async () => {
		const load = vi.fn(() => Promise.resolve('loaded'));
		const loadOnce = onceAsync(load);

		await expect(loadOnce()).resolves.toBe('loaded');
		await expect(loadOnce()).resolves.toBe('loaded');
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('tries again after a failed load', async () => {
		const load = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('missing addon'))
			.mockResolvedValueOnce('loaded');
		const loadOnce = onceAsync(load);

		await expect(loadOnce()).rejects.toThrow('missing addon');
		await expect(loadOnce()).resolves.toBe('loaded');
		expect(load).toHaveBeenCalledTimes(2);
	});
});
