import { z } from 'zod';

import { SpotifyPlayerBinding } from './spotify_player_binding';
import type { SpotifyPlayerState } from './spotify_player_state';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

const bindingCalledSchema = z.object({
	name: z.string(),
	payload: z.string(),
});

const playerPayloadSchema = z.object({
	isPaused: z.boolean(),
	trackUri: z.string().nullable(),
});

function decodeJson(payload: string): unknown {
	try {
		return JSON.parse(payload);
	} catch (error) {
		throw new SpotifyInvalidResponseError({
			reason: 'the player payload is not valid JSON',
			cause: error,
		});
	}
}

/**
 * Interprets the params of a `Runtime.bindingCalled` event.
 * Returns the player state, or `undefined` when the call belongs to another binding.
 */
export function parsePlayerBindingPayload(
	params: unknown
): SpotifyPlayerState | undefined {
	const call = bindingCalledSchema.safeParse(params);
	if (!call.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected binding call',
			cause: call.error,
		});
	}
	if (call.data.name !== SpotifyPlayerBinding.name) {
		return undefined;
	}
	const payload = playerPayloadSchema.safeParse(decodeJson(call.data.payload));
	if (!payload.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected player payload',
			cause: payload.error,
		});
	}
	return {
		isPaused: payload.data.isPaused,
		trackUri: payload.data.trackUri ?? undefined,
	};
}
