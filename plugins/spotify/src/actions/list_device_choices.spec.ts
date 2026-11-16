import { describe, expect, it } from 'vitest';

import type { SpotifyDevice } from '../spotify/spotify_device';
import { listDeviceChoices } from './list_device_choices';

function buildDevice(id: string, name: string): SpotifyDevice {
	return { id, name, kind: 'computer', isActive: false };
}

const DEVICES = [
	buildDevice('local_device', 'DESKTOP'),
	buildDevice('phone', 'Phone'),
];

describe('listDeviceChoices', () => {
	it('should list the devices by name', () => {
		expect(
			listDeviceChoices({
				devices: DEVICES,
				settings: {},
				language: 'en',
			})
		).toEqual([
			{ label: 'DESKTOP', value: 'local_device' },
			{ label: 'Phone', value: 'phone' },
		]);
	});

	it('should not repeat the picked device when it is listed', () => {
		expect(
			listDeviceChoices({
				devices: DEVICES,
				settings: { deviceId: 'phone' },
				language: 'en',
			})
		).toHaveLength(2);
	});

	it('should keep the picked device first while Spotify does not see it', () => {
		const choices = listDeviceChoices({
			devices: DEVICES,
			settings: { deviceId: 'tv', deviceName: 'TV' },
			language: 'en',
		});

		expect(choices[0]).toEqual({ label: 'TV (not found)', value: 'tv' });
	});

	it('should name a missing picked device whose name is unknown', () => {
		const [choice] = listDeviceChoices({
			devices: [],
			settings: { deviceId: 'tv' },
			language: 'en',
		});

		expect(choice).toEqual({ label: 'Picked device (not found)', value: 'tv' });
	});

	it('should give an empty list when no device is listed nor picked', () => {
		expect(
			listDeviceChoices({
				devices: [],
				settings: { deviceId: '' },
				language: 'en',
			})
		).toEqual([]);
	});

	it('should write a missing picked device in French', () => {
		const [choice] = listDeviceChoices({
			devices: [],
			settings: { deviceId: 'tv' },
			language: 'fr',
		});

		expect(choice).toEqual({
			label: 'Appareil choisi (introuvable)',
			value: 'tv',
		});
	});
});
