import { describe, expect, it } from 'vitest';

import { parseUiBindingPayload } from './parse_ui_binding_payload';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';
import { SpotifyUiBinding } from './spotify_ui_binding';

const STATE = {
	isLyricsAvailable: true,
	isLyricsOpen: true,
	isFullscreen: false,
	isSearchOpen: false,
	isFocused: true,
};

function buildBindingCall(
	payload: string,
	name: string = SpotifyUiBinding.name
) {
	return { name, payload, executionContextId: 1 };
}

describe('parseUiBindingPayload', () => {
	it('should return the state of the window', () => {
		expect(
			parseUiBindingPayload(buildBindingCall(JSON.stringify(STATE)))
		).toEqual(STATE);
	});

	it('should return undefined when the call belongs to another binding', () => {
		expect(
			parseUiBindingPayload(buildBindingCall('not json', 'other'))
		).toBeUndefined();
	});

	it('should throw an invalid response error when the payload is not JSON', () => {
		expect(() => parseUiBindingPayload(buildBindingCall('nope'))).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the payload has an unexpected shape', () => {
		const payload = JSON.stringify({ ...STATE, isFocused: 'yes' });

		expect(() => parseUiBindingPayload(buildBindingCall(payload))).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the params have an unexpected shape', () => {
		expect(() => parseUiBindingPayload('nope')).toThrow(
			SpotifyInvalidResponseError
		);
	});
});
