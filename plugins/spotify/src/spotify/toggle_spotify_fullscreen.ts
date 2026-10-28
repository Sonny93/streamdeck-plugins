import { SpotifyTestIds } from './spotify_test_ids';
import type { SpotifyCommand } from './spotify_command';
import { clickSpotifyElement } from './click_spotify_element';
import type { BringToFrontOptions } from './bring_to_front_options';
import { clickFullscreenAndWait } from './click_fullscreen_and_wait';
import { stopSpotifyWindowFlashing } from './stop_spotify_window_flashing';
import { bringSpotifyToFrontIfUnfocused } from './bring_spotify_to_front_if_unfocused';

/**
 * Builds the command that toggles full screen mode.
 * With bring-to-front, Spotify is activated first so Windows has nothing to flash.
 * Without it, the click is followed by stopping the taskbar flash Windows starts for a background window.
 */
export function toggleSpotifyFullscreen(
	options: BringToFrontOptions
): SpotifyCommand {
	return async (session) => {
		if (options.shouldBringToFront) {
			await bringSpotifyToFrontIfUnfocused(session);
			await clickSpotifyElement(session, SpotifyTestIds.fullscreenModeButton);
			return;
		}
		await clickFullscreenAndWait(session);
		await stopSpotifyWindowFlashing(session);
	};
}
