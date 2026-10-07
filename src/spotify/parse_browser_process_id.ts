import { z } from 'zod';

import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

const BROWSER_PROCESS_TYPE = 'browser';

const processInfoSchema = z.object({
	processInfo: z.array(z.object({ type: z.string(), id: z.number() })),
});

/**
 * Extracts the browser process id from a raw `SystemInfo.getProcessInfo` result.
 * The browser process owns Spotify's main window.
 */
export function parseBrowserProcessId(rawResult: unknown): number {
	const parsed = processInfoSchema.safeParse(rawResult);
	if (!parsed.success) {
		throw new SpotifyInvalidResponseError({
			reason: 'unexpected process info',
			cause: parsed.error,
		});
	}
	const browserProcess = parsed.data.processInfo.find(
		(processInfo) => processInfo.type === BROWSER_PROCESS_TYPE
	);
	if (browserProcess === undefined) {
		throw new SpotifyInvalidResponseError({
			reason: 'no browser process in the process info',
		});
	}
	return browserProcess.id;
}
