import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';
import { runPlatformScript } from './run_platform_script';

const SKIP_TO_PREVIOUS_BODY = `
	await resolve(${JSON.stringify(SpotifyServices.player)}).skipToPrevious();
`;

/** Skips to the previous track. */
export async function skipSpotifyToPrevious(
	session: SpotifySession
): Promise<void> {
	await runPlatformScript(session, SKIP_TO_PREVIOUS_BODY);
}
