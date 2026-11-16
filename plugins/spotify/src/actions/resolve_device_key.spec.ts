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
			resolveDeviceKey({
				settings: buildSettings(),
				activeDeviceId: undefined,
				language: 'en',
			})
		).toEqual({ kind: 'phone', label: 'Phone', isActive: false });
	});

	it('should be lit while the picked device plays', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings(),
				activeDeviceId: 'phone',
				language: 'en',
			}).isActive
		).toBe(true);
	});

	it('should not be lit while another device plays', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings(),
				activeDeviceId: 'local_device',
				language: 'en',
			}).isActive
		).toBe(false);
	});

	it('should prefer the typed label', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings({ label: '  PC  ' }),
				activeDeviceId: undefined,
				language: 'en',
			}).label
		).toBe('PC');
	});

	it('should fall back on the device name when the typed label is blank', () => {
		expect(
			resolveDeviceKey({
				settings: buildSettings({ label: ' ' }),
				activeDeviceId: undefined,
				language: 'en',
			}).label
		).toBe('Phone');
	});

	it('should draw a device whose name and kind are unknown yet as a speaker', () => {
		expect(
			resolveDeviceKey({
				settings: { deviceId: 'tv' },
				activeDeviceId: undefined,
				language: 'en',
			})
		).toEqual({ kind: 'speaker', label: 'Device', isActive: false });
	});

	it('should tell when no device is picked, and never be lit', () => {
		expect(
			resolveDeviceKey({
				settings: { deviceId: '' },
				activeDeviceId: '',
				language: 'en',
			})
		).toEqual({ kind: 'speaker', label: 'No device', isActive: false });
	});

	it.each([
		[{ deviceId: '' }, 'Sans appareil'],
		[{ deviceId: 'tv' }, 'Appareil'],
	] as const)(
		'should write the fallback label of %j in French',
		(settings, label) => {
			expect(
				resolveDeviceKey({
					settings,
					activeDeviceId: undefined,
					language: 'fr',
				}).label
			).toBe(label);
		}
	);
});
