import { z } from 'zod';

import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';
import { SpotifyUiBinding } from './spotify_ui_binding';
import type { SpotifyUiState } from './spotify_ui_state';

const bindingCalledSchema = z.object({
	name: z.string(),
	payload: z.string(),
});

const uiPayloadSchema = z.object({
	isLyricsAvailable: z.boolean(),
	isLyricsOpen: z.boolean(),
	isFullscreen: z.boolean(),
	isSearchOpen: z.boolean(),
	isFocused: z.boolean(),
});

function decodeJson(payload: string): unknown {
	try {
		return JSON.parse(payload);
	} catch (error) {
		throw new SpotifyInvalidResponseError({
			reason: 'the window state payload is not valid JSON',
			cause: error,
		});
	}
}

/**
 * Interprets the params of a `Runtime.bindingCalled` event.
 * Returns the state of the Spotify window, or `undefined` when the call belongs to another binding.
 */
export function parseUiBindingPayload(
	params: unknown
): SpotifyUiState | undefined {
	const call = bindingCalledSchema.safeParse(params);
	if (!call.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected binding call',
			cause: call.error,
		});
	}
	if (call.data.name !== SpotifyUiBinding.name) {
		return undefined;
	}
	const payload = uiPayloadSchema.safeParse(decodeJson(call.data.payload));
	if (!payload.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected window state payload',
			cause: payload.error,
		});
	}
	return payload.data;
}
