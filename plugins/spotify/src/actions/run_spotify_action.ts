import { streamDeck } from '@elgato/streamdeck';
import type { KeyDownEvent } from '@elgato/streamdeck';

import { runSpotifyCommand } from '../spotify/run_spotify_command';
import type { SpotifyCommand } from '../spotify/spotify_command';

type AlertableAction = Pick<KeyDownEvent['action'], 'manifestId' | 'showAlert'>;

/**
 * Runs a Spotify command for a key press; failures are logged and shown as an alert on the key.
 * Resolves to whether the command succeeded.
 */
export async function runSpotifyAction(
	action: AlertableAction,
	command: SpotifyCommand
): Promise<boolean> {
	try {
		await runSpotifyCommand(command);
		return true;
	} catch (error) {
		streamDeck.logger.error(
			`Spotify action ${action.manifestId} failed`,
			error
		);
		await action.showAlert();
		return false;
	}
}
