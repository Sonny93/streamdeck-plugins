import { describe, expect, it } from 'vitest';

import { removePersonalSettings } from './remove_personal_settings.ts';

function buildManifest(actions: unknown): unknown {
	return { Controllers: [{ Type: 'Keypad', Actions: actions }] };
}

describe('removePersonalSettings', () => {
	it('should drop the personal settings of a com.sonny93 action and keep the others', () => {
		const manifest = buildManifest({
			'0,0': {
				UUID: 'com.sonny93.spotify.play-on-device',
				Settings: {
					deviceId: 'abc',
					deviceName: 'Phone',
					device: 'd',
					monitor: 'm',
					selectedUri: 'spotify:playlist:1',
					deviceKind: 'phone',
				},
			},
		});

		expect(removePersonalSettings({ manifest })).toEqual(
			buildManifest({
				'0,0': {
					UUID: 'com.sonny93.spotify.play-on-device',
					Settings: { deviceKind: 'phone' },
				},
			})
		);
	});

	it('should drop the app image name and the target that goes with it', () => {
		const manifest = buildManifest({
			'0,0': {
				UUID: 'com.sonny93.spotify.volume',
				Settings: { appImageName: 'msedge.exe', target: 'app', step: 5 },
			},
		});

		expect(removePersonalSettings({ manifest })).toEqual(
			buildManifest({
				'0,0': {
					UUID: 'com.sonny93.spotify.volume',
					Settings: { step: 5 },
				},
			})
		);
	});

	it('should keep the target when there is no app image name', () => {
		const manifest = buildManifest({
			'0,0': {
				UUID: 'com.sonny93.spotify.volume',
				Settings: { target: 'spotify' },
			},
		});

		expect(removePersonalSettings({ manifest })).toEqual(manifest);
	});

	it.each([
		'com.sonny93.audio.default-output',
		'com.sonny93.spotify.play-on-device',
	])('should drop the label of %s', (uuid) => {
		const manifest = buildManifest({
			'0,0': { UUID: uuid, Settings: { label: 'Casque', other: 1 } },
		});

		expect(removePersonalSettings({ manifest })).toEqual(
			buildManifest({ '0,0': { UUID: uuid, Settings: { other: 1 } } })
		);
	});

	it('should leave actions of other plugins untouched', () => {
		const manifest = buildManifest({
			'0,0': {
				UUID: 'com.elgato.streamdeck.profile.openchild',
				Settings: { device: 'keep', ProfileUUID: 'x' },
			},
		});

		expect(removePersonalSettings({ manifest })).toEqual(manifest);
	});

	it('should return the manifest unchanged when Actions is null', () => {
		const manifest = buildManifest(null);

		expect(removePersonalSettings({ manifest })).toEqual(manifest);
	});

	it('should return JSON that is not a page manifest unchanged', () => {
		const manifest = { Name: 'Spotify Deck', Pages: { Current: 'x' } };

		expect(removePersonalSettings({ manifest })).toEqual(manifest);
	});
});
