import { spawn } from 'node:child_process';

import { SpotifyEndpoint } from '../spotify/spotify_endpoint';
import { SpotifyLaunchFailedError } from '../spotify/spotify_launch_failed_error';

const SPOTIFY_COMMAND = 'spotify';

/** Starts Spotify from the PATH with the DevTools port enabled, detached from the plugin. */
export function launchSpotify(): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(
			SPOTIFY_COMMAND,
			[`--remote-debugging-port=${SpotifyEndpoint.debugPort}`],
			{ detached: true, stdio: 'ignore' }
		);
		child.once('error', (error) =>
			reject(
				new SpotifyLaunchFailedError({
					reason: `cannot spawn ${SPOTIFY_COMMAND}`,
					cause: error,
				})
			)
		);
		child.once('spawn', () => {
			child.unref();
			resolve();
		});
	});
}
