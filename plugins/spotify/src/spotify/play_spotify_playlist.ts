import { SpotifyServices } from './spotify_services';
import type { SpotifyCommand } from './spotify_command';
import { runPlatformScript } from './run_platform_script';

/** Builds the command that starts playing the playlist (or any context) with the given URI. */
export function playSpotifyPlaylist(uri: string): SpotifyCommand {
	const body = `
		await resolve(${JSON.stringify(SpotifyServices.player)}).play({ uri: ${JSON.stringify(uri)} }, {}, {});
	`;
	return async (session) => {
		await runPlatformScript(session, body);
	};
}
