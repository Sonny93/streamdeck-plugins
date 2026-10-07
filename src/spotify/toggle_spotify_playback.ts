import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';
import { runPlatformScript } from './run_platform_script';

const TOGGLE_PLAYBACK_BODY = `
	const player = resolve(${JSON.stringify(SpotifyServices.player)});
	const state = await player.getState();
	if (state.isPaused) {
		await player.resume();
	} else {
		await player.pause();
	}
`;

/** Resumes Spotify playback when it is paused, and pauses it otherwise. */
export async function toggleSpotifyPlayback(
	session: SpotifySession
): Promise<void> {
	await runPlatformScript(session, TOGGLE_PLAYBACK_BODY);
}
