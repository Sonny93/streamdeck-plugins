import { z } from 'zod';

import { resolveSpotifyImageUrl } from './resolve_spotify_image_url';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';
import { SpotifyPlayerBinding } from './spotify_player_binding';
import type { SpotifyPlayerState } from './spotify_player_state';
import type { SpotifyPlayingTrack } from './spotify_playing_track';

const bindingCalledSchema = z.object({
	name: z.string(),
	payload: z.string(),
});

const trackPayloadSchema = z.object({
	title: z.string(),
	artistNames: z.array(z.string()),
	imageUrl: z.string().nullable(),
	durationMilliseconds: z.number(),
	positionMilliseconds: z.number(),
	positionTimestamp: z.number(),
	playbackSpeed: z.number(),
});

const playerPayloadSchema = z.object({
	isPaused: z.boolean(),
	trackUri: z.string().nullable(),
	track: trackPayloadSchema.nullable(),
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

function toPlayingTrack(
	track: z.infer<typeof trackPayloadSchema> | null
): SpotifyPlayingTrack | undefined {
	if (track === null) {
		return undefined;
	}
	return {
		...track,
		imageUrl:
			track.imageUrl === null
				? undefined
				: resolveSpotifyImageUrl(track.imageUrl),
	};
}

/**
 * Interprets the params of a `Runtime.bindingCalled` event.
 * Returns the player state, or `undefined` when the call belongs to another binding.
 * The cover reference of the track is turned into a downloadable URL; an unknown scheme leaves the track without cover.
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
		track: toPlayingTrack(payload.data.track),
	};
}
