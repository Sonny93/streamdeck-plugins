import { describe, expect, it } from 'vitest';

import { SpotifyPlayerBinding } from './spotify_player_binding';
import { parsePlayerBindingPayload } from './parse_player_binding_payload';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

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
		});

		expect(parsePlayerBindingPayload(buildBindingCall(payload))).toEqual({
			isPaused: true,
			trackUri: 'spotify:track:abc',
		});
	});

	it('should return an undefined track uri when no track is loaded', () => {
		const payload = JSON.stringify({ isPaused: false, trackUri: null });

		expect(parsePlayerBindingPayload(buildBindingCall(payload))).toEqual({
			isPaused: false,
			trackUri: undefined,
		});
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
		const payload = JSON.stringify({ isPaused: 'yes', trackUri: null });

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
