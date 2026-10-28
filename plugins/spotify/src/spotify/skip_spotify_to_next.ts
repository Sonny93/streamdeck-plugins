import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';
import { runPlatformScript } from './run_platform_script';

const SKIP_TO_NEXT_BODY = `
	await resolve(${JSON.stringify(SpotifyServices.player)}).skipToNext();
`;

/** Skips to the next track. */
export async function skipSpotifyToNext(
	session: SpotifySession
): Promise<void> {
	await runPlatformScript(session, SKIP_TO_NEXT_BODY);
}
