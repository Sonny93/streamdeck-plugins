import { describe, expect, it } from 'vitest';

import type { SpotifyDevice } from '../spotify/spotify_device';
import { rememberPickedDevice } from './remember_picked_device';

function buildDevice(overrides: Partial<SpotifyDevice> = {}): SpotifyDevice {
	return {
		id: 'phone',
		name: 'Phone',
		kind: 'phone',
		isActive: false,
		...overrides,
	};
}

describe('rememberPickedDevice', () => {
	it('should copy the name and kind of the picked device, keeping the other settings', () => {
		expect(
			rememberPickedDevice({
				settings: { deviceId: 'phone', label: 'Mine' },
				devices: [buildDevice()],
			})
		).toEqual({
			deviceId: 'phone',
			deviceName: 'Phone',
			deviceKind: 'phone',
			label: 'Mine',
		});
	});

	it('should follow a renamed device', () => {
		expect(
			rememberPickedDevice({
				settings: { deviceId: 'phone', deviceName: 'Old', deviceKind: 'phone' },
				devices: [buildDevice()],
			})?.deviceName
		).toBe('Phone');
	});

	it('should change nothing when the name and kind are already known', () => {
		expect(
			rememberPickedDevice({
				settings: {
					deviceId: 'phone',
					deviceName: 'Phone',
					deviceKind: 'phone',
				},
				devices: [buildDevice()],
			})
		).toBeUndefined();
	});

	it('should change nothing when the picked device is not listed', () => {
		expect(
			rememberPickedDevice({
				settings: { deviceId: 'tv' },
				devices: [buildDevice()],
			})
		).toBeUndefined();
	});

	it('should change nothing when no device is picked', () => {
		expect(
			rememberPickedDevice({ settings: {}, devices: [buildDevice()] })
		).toBeUndefined();
	});
});
