import type { SpotifyCommand } from './spotify_command';
import { clickSpotifyElement } from './click_spotify_element';
import type { BringToFrontOptions } from './bring_to_front_options';
import { bringSpotifyToFrontIfUnfocused } from './bring_spotify_to_front_if_unfocused';

type ToggleCommandOptions = BringToFrontOptions & Readonly<{ testId: string }>;

/** Builds a command that clicks a Spotify toggle button, optionally bringing Spotify to the front first. */
export function buildToggleCommand(
	options: ToggleCommandOptions
): SpotifyCommand {
	return async (session) => {
		if (options.shouldBringToFront) {
			await bringSpotifyToFrontIfUnfocused(session);
		}
		await clickSpotifyElement(session, options.testId);
	};
}
