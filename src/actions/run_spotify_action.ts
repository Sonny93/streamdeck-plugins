import { streamDeck } from '@elgato/streamdeck';
import type { KeyDownEvent } from '@elgato/streamdeck';

import type { SpotifyCommand } from '../spotify/spotify_command';
import { runSpotifyCommand } from '../spotify/run_spotify_command';

type AlertableAction = Pick<KeyDownEvent['action'], 'manifestId' | 'showAlert'>;

/** Runs a Spotify command for a key press; failures are logged and shown as an alert on the key. */
export async function runSpotifyAction(
	action: AlertableAction,
	command: SpotifyCommand
): Promise<void> {
	try {
		await runSpotifyCommand(command);
	} catch (error) {
		streamDeck.logger.error(
			`Spotify action ${action.manifestId} failed`,
			error
		);
		await action.showAlert();
	}
}
