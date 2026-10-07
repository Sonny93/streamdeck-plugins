import { describe, expect, it } from 'vitest';

import { SpotifyLyricsBinding } from './spotify_lyrics_binding';
import { parseLyricsBindingPayload } from './parse_lyrics_binding_payload';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

function buildBindingCall(
	payload: string,
	name: string = SpotifyLyricsBinding.name
) {
	return { name, payload, executionContextId: 1 };
}

describe('parseLyricsBindingPayload', () => {
	it('should return true when the payload is available', () => {
		expect(parseLyricsBindingPayload(buildBindingCall('available'))).toBe(true);
	});

	it('should return false when the payload is unavailable', () => {
		expect(parseLyricsBindingPayload(buildBindingCall('unavailable'))).toBe(
			false
		);
	});

	it('should return undefined when the call belongs to another binding', () => {
		expect(
			parseLyricsBindingPayload(buildBindingCall('available', 'other'))
		).toBeUndefined();
	});

	it('should throw an invalid response error when the payload is unknown', () => {
		expect(() => parseLyricsBindingPayload(buildBindingCall('maybe'))).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the params have an unexpected shape', () => {
		expect(() => parseLyricsBindingPayload('nope')).toThrow(
			SpotifyInvalidResponseError
		);
	});
});
