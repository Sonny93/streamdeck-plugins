import { describe, expect, it } from 'vitest';

import { parsePlayerBindingPayload } from './parse_player_binding_payload';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';
import { SpotifyPlayerBinding } from './spotify_player_binding';

const TRACK_PAYLOAD = {
	title: 'Kosandra',
	artistNames: ['Miyagi & Andy Panda'],
	imageUrl: 'spotify:image:ab67616d00004851a2d00f6f1122d5613451e292',
	durationMilliseconds: 219_378,
	positionMilliseconds: 14_952,
	positionTimestamp: 1_792_071_125_476,
	playbackSpeed: 1,
};

function buildBindingCall(
	payload: string,
	name: string = SpotifyPlayerBinding.name
) {
	return { name, payload, executionContextId: 1 };
}

describe('parsePlayerBindingPayload', () => {
	it('should return the paused state and the track uri', () => {
		const payload = JSON.stringify({
			isPaused: true,
			trackUri: 'spotify:track:abc',
			track: null,
			activeDeviceId: null,
		});

		expect(parsePlayerBindingPayload(buildBindingCall(payload))).toEqual({
			isPaused: true,
			trackUri: 'spotify:track:abc',
			track: undefined,
			activeDeviceId: undefined,
		});
	});

	it('should return the playing track with a downloadable cover url', () => {
		const payload = JSON.stringify({
			isPaused: false,
			trackUri: 'spotify:track:abc',
			track: TRACK_PAYLOAD,
			activeDeviceId: null,
		});

		expect(parsePlayerBindingPayload(buildBindingCall(payload))?.track).toEqual(
			{
				...TRACK_PAYLOAD,
				imageUrl:
					'https://i.scdn.co/image/ab67616d00004851a2d00f6f1122d5613451e292',
			}
		);
	});

	it('should leave the track without cover when the image reference is unknown', () => {
		const payload = JSON.stringify({
			isPaused: false,
			trackUri: 'spotify:track:abc',
			track: { ...TRACK_PAYLOAD, imageUrl: 'file:///cover.jpg' },
			activeDeviceId: null,
		});

		expect(
			parsePlayerBindingPayload(buildBindingCall(payload))?.track?.imageUrl
		).toBeUndefined();
	});

	it('should leave the track without cover when it has no image', () => {
		const payload = JSON.stringify({
			isPaused: false,
			trackUri: 'spotify:track:abc',
			track: { ...TRACK_PAYLOAD, imageUrl: null },
			activeDeviceId: null,
		});

		expect(
			parsePlayerBindingPayload(buildBindingCall(payload))?.track?.imageUrl
		).toBeUndefined();
	});

	it('should return an undefined track uri when no track is loaded', () => {
		const payload = JSON.stringify({
			isPaused: false,
			trackUri: null,
			track: null,
			activeDeviceId: null,
		});

		expect(parsePlayerBindingPayload(buildBindingCall(payload))).toEqual({
			isPaused: false,
			trackUri: undefined,
			track: undefined,
			activeDeviceId: undefined,
		});
	});

	it('should return the Spotify Connect device that plays', () => {
		const payload = JSON.stringify({
			isPaused: false,
			trackUri: null,
			track: null,
			activeDeviceId: 'local_device',
		});

		expect(
			parsePlayerBindingPayload(buildBindingCall(payload))?.activeDeviceId
		).toBe('local_device');
	});

	it('should return undefined when the call belongs to another binding', () => {
		expect(
			parsePlayerBindingPayload(buildBindingCall('not json', 'other'))
		).toBeUndefined();
	});

	it('should throw an invalid response error when the payload is not JSON', () => {
		expect(() => parsePlayerBindingPayload(buildBindingCall('nope'))).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the payload has an unexpected shape', () => {
		const payload = JSON.stringify({
			isPaused: 'yes',
			trackUri: null,
			track: null,
			activeDeviceId: null,
		});

		expect(() => parsePlayerBindingPayload(buildBindingCall(payload))).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the params have an unexpected shape', () => {
		expect(() => parsePlayerBindingPayload('nope')).toThrow(
			SpotifyInvalidResponseError
		);
	});
});
