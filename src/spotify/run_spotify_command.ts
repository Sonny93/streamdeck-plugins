import type { SpotifyCommand } from './spotify_command';
import { connectToSpotify } from './connect_to_spotify';
import { useSpotifySession } from './use_spotify_session';

/** Connects to Spotify (launching it if needed), runs the command, and always closes the CDP connections afterwards. */
export async function runSpotifyCommand(
	command: SpotifyCommand
): Promise<void> {
	await useSpotifySession(await connectToSpotify(), command);
}
