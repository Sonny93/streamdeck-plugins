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
					label: 'Phone',
					deviceKind: 'phone',
				},
			},
		});

		expect(removePersonalSettings({ manifest })).toEqual(
			buildManifest({
				'0,0': {
					UUID: 'com.sonny93.spotify.play-on-device',
					Settings: { label: 'Phone', deviceKind: 'phone' },
				},
			})
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
