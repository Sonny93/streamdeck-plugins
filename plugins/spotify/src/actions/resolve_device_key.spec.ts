import { describe, expect, it } from 'vitest';

import type { PlayOnDeviceSettings } from './play_on_device_settings';
import { resolveDeviceKey } from './resolve_device_key';

function buildSettings(
	overrides: Partial<PlayOnDeviceSettings> = {}
): PlayOnDeviceSettings {
	return {
		deviceId: 'phone',
		deviceName: 'Phone',
		deviceKind: 'phone',
		...overrides,
	};
}

describe('resolveDeviceKey', () => {
	it('should show the device name and kind', () => {
		expect(
			resolveDeviceKey({ settings: buildSettings(), activeDeviceId: undefined })
		).toEqual({ kind: 'phone', label: 'Phone', isActive: false });
	});

	it('should be lit while the picked device plays', () => {
		expect(
			resolveDeviceKey({ settings: buildSettings(), activeDeviceId: 'phone' })
				.isActive
		).toBe(true);
	});

	it('should not be lit while another device plays', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings(),
				activeDeviceId: 'local_device',
			}).isActive
		).toBe(false);
	});

	it('should prefer the typed label', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings({ label: '  PC  ' }),
				activeDeviceId: undefined,
			}).label
		).toBe('PC');
	});

	it('should fall back on the device name when the typed label is blank', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings({ label: ' ' }),
				activeDeviceId: undefined,
			}).label
		).toBe('Phone');
	});

	it('should draw a device whose name and kind are unknown yet as a speaker', () => {
		expect(
			resolveDeviceKey({
				settings: { deviceId: 'tv' },
				activeDeviceId: undefined,
			})
		).toEqual({ kind: 'speaker', label: 'Device', isActive: false });
	});

	it('should tell when no device is picked, and never be lit', () => {
		expect(
			resolveDeviceKey({ settings: { deviceId: '' }, activeDeviceId: '' })
		).toEqual({ kind: 'speaker', label: 'No device', isActive: false });
	});
});
