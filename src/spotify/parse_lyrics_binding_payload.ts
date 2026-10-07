import { z } from 'zod';

import { LyricsBindingPayload } from './lyrics_binding_payload';
import { SpotifyLyricsBinding } from './spotify_lyrics_binding';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

const bindingCalledSchema = z.object({
	name: z.string(),
	payload: z.string(),
});

/**
 * Interprets the params of a `Runtime.bindingCalled` event.
 * Returns whether lyrics are available, or `undefined` when the call belongs to another binding.
 */
export function parseLyricsBindingPayload(
	params: unknown
): boolean | undefined {
	const parsed = bindingCalledSchema.safeParse(params);
	if (!parsed.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected binding call',
			cause: parsed.error,
		});
	}
	if (parsed.data.name !== SpotifyLyricsBinding.name) {
		return undefined;
	}
	if (parsed.data.payload === LyricsBindingPayload.available) {
		return true;
	}
	if (parsed.data.payload === LyricsBindingPayload.unavailable) {
		return false;
	}
	throw new SpotifyInvalidResponseError({
		reason: `unexpected lyrics payload "${parsed.data.payload}"`,
	});
}
