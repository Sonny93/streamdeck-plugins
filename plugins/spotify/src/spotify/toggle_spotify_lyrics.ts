import type { BringToFrontOptions } from './bring_to_front_options';
import { buildToggleCommand } from './build_toggle_command';
import type { SpotifyHostCommand } from './spotify_host_command';
import { SpotifyTestIds } from './spotify_test_ids';

/** Builds the command that shows or hides the lyrics view. */
export function toggleSpotifyLyrics(
	options: BringToFrontOptions
): SpotifyHostCommand {
	return buildToggleCommand({
		...options,
		testId: SpotifyTestIds.lyricsButton,
	});
}
