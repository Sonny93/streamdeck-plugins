import type { z } from 'zod';

import { SpotifyEndpoint } from './spotify_endpoint';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';

async function fetchResponse(path: string): Promise<Response> {
	try {
		return await fetch(`${SpotifyEndpoint.httpBaseUrl}${path}`, {
			signal: AbortSignal.timeout(SpotifyEndpoint.httpTimeoutMilliseconds),
		});
	} catch (error) {
		throw new SpotifyNotReachableError({ cause: error });
	}
}

/** Fetches a DevTools HTTP path and validates the JSON body against the given schema. */
export async function fetchSpotifyJson<TSchema extends z.ZodType>(
	options: Readonly<{ path: string; schema: TSchema }>
): Promise<z.output<TSchema>> {
	const response = await fetchResponse(options.path);
	if (!response.ok) {
		throw new SpotifyInvalidResponseError({
			reason: `${options.path} answered HTTP ${response.status}`,
		});
	}
	const parsed = options.schema.safeParse(await response.json());
	if (!parsed.success) {
		throw new SpotifyInvalidResponseError({
			reason: `${options.path} returned an unexpected payload`,
			cause: parsed.error,
		});
	}
	return parsed.data;
}
