import { SpotifyTestIds } from './spotify_test_ids';
import type { SpotifyCommand } from './spotify_command';
import { buildToggleCommand } from './build_toggle_command';
import type { BringToFrontOptions } from './bring_to_front_options';

/** Builds the command that shows or hides the lyrics view. */
export function toggleSpotifyLyrics(
	options: BringToFrontOptions
): SpotifyCommand {
	return buildToggleCommand({
		...options,
		testId: SpotifyTestIds.lyricsButton,
	});
}
