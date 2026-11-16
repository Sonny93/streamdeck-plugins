import { describe, expect, it, vi } from 'vitest';

import { loadPlatformAdapters } from './load_platform_adapters';
import { UnsupportedPlatformError } from './unsupported_platform_error';

describe('loadPlatformAdapters', () => {
	it('should load the pactl and hidraw adapters on Linux', async () => {
		const onUnsupported = vi.fn();

		const adapters = await loadPlatformAdapters('linux', onUnsupported);

		expect(adapters.audio.watchChanges).toBeDefined();
		expect(adapters.elgatoAudioServerProcess.isSupported).toBe(false);
		expect(onUnsupported).not.toHaveBeenCalled();
	});

	it('should give adapters that fail cleanly on an unknown platform', async () => {
		const onUnsupported = vi.fn();

		const adapters = await loadPlatformAdapters('freebsd', onUnsupported);

		expect(onUnsupported).toHaveBeenCalledWith('freebsd');
		await expect(adapters.audio.loadCoreAudio()).rejects.toBeInstanceOf(
			UnsupportedPlatformError
		);
		await expect(adapters.openVoltConnection()).rejects.toBeInstanceOf(
			UnsupportedPlatformError
		);
		expect(adapters.elgatoAudioServerProcess.isSupported).toBe(false);
	});
});
