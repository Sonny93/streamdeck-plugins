import { connectToSpotify } from './connect_to_spotify';
import type { SpotifyCommand } from './spotify_command';

/** Connects to Spotify, runs the command, and always closes the CDP connections afterwards. */
export async function runSpotifyCommand(
	command: SpotifyCommand
): Promise<void> {
	const session = await connectToSpotify();
	try {
		await command(session);
	} finally {
		session.page.close();
		session.browser.close();
	}
}
