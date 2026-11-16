import { CurrentSpotifyHost } from '../platform/current_spotify_host';
import { connectToSpotify } from './connect_to_spotify';
import type { SpotifyHostCommand } from './spotify_host_command';
import { useSpotifySession } from './use_spotify_session';

/** Connects to Spotify (launching it if needed), runs the command, and always closes the CDP connections afterwards. */
export async function runSpotifyCommand(
	command: SpotifyHostCommand
): Promise<void> {
	const host = CurrentSpotifyHost.require();
	await useSpotifySession(await connectToSpotify(host), (session) =>
		command(session, host)
	);
}
