import path from 'node:path';
import { spawn } from 'node:child_process';

import { SpotifyEndpoint } from './spotify_endpoint';
import { SpotifyLaunchFailedError } from './spotify_launch_failed_error';

function resolveSpotifyExecutable(): string {
	const localAppData = process.env['LOCALAPPDATA'];
	if (localAppData === undefined || localAppData === '') {
		throw new SpotifyLaunchFailedError({
			reason: 'the LOCALAPPDATA environment variable is not set',
		});
	}
	return path.join(localAppData, 'Microsoft', 'WindowsApps', 'Spotify.exe');
}

/** Starts the Microsoft Store Spotify through its WindowsApps alias with the DevTools port enabled. */
export function launchSpotify(): Promise<void> {
	return new Promise((resolve, reject) => {
		const executable = resolveSpotifyExecutable();
		const child = spawn(
			executable,
			[`--remote-debugging-port=${SpotifyEndpoint.debugPort}`],
			{
				detached: true,
				stdio: 'ignore',
			}
		);
		child.once('error', (error) =>
			reject(
				new SpotifyLaunchFailedError({
					reason: `cannot spawn ${executable}`,
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
