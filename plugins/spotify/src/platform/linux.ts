import { streamDeck } from '@elgato/streamdeck';

import { activateProcessWindow } from '../linux/activate_process_window';
import { createCoverPreparer } from '../linux/create_cover_preparer';
import { createForegroundAppReader } from '../linux/create_foreground_app_reader';
import { createKdotoolMissingReporter } from '../linux/create_kdotool_missing_reporter';
import { createPactlAudioMixer } from '../linux/create_pactl_audio_mixer';
import { createPngRenderer } from '../linux/create_png_renderer';
import { createRenderErrorReporter } from '../linux/create_render_error_reporter';
import { isSpotifyPageFocused } from '../linux/is_spotify_page_focused';
import { isSpotifyRunning } from '../linux/is_spotify_running';
import { killSpotify } from '../linux/kill_spotify';
import { launchSpotify } from '../linux/launch_spotify';
import { scaleBackdropFast } from '../linux/scale_backdrop_fast';
import { toPngDataUrl } from '../linux/to_png_data_url';
import type { SpotifyHost } from './spotify_host';

const SPOTIFY_IMAGE_NAME = 'spotify';

const renderPng = createPngRenderer();

const reportRenderError = createRenderErrorReporter((message, error) =>
	streamDeck.logger.error(message, error)
);

const reportMissingKdotool = createKdotoolMissingReporter((message) =>
	streamDeck.logger.warn(message)
);

/** The Linux host: Spotify from the PATH, driven through /proc, kdotool (KDE Wayland) and pactl.
 * Frames reach OpenDeck as PNG, since its renderer drops the pictures embedded in an SVG. */
export const linuxSpotifyHost: SpotifyHost = {
	spotifyImageName: SPOTIFY_IMAGE_NAME,
	launchSpotify,
	isSpotifyRunning: () => isSpotifyRunning(),
	killSpotify: () => killSpotify(),
	isWindowInForeground: (target) => isSpotifyPageFocused(target.session),
	activateWindow: async (processId) => {
		try {
			await activateProcessWindow({ processId });
		} catch (error) {
			reportMissingKdotool(error);
			throw error;
		}
	},
	stopWindowFlashing: () => Promise.resolve(),
	audioMixer: createPactlAudioMixer({
		readForegroundApp: createForegroundAppReader({
			onMissingKdotool: reportMissingKdotool,
		}),
	}),
	encodeFrame: async (svg) => {
		try {
			return toPngDataUrl(await renderPng(scaleBackdropFast(svg)));
		} catch (error) {
			reportRenderError(error);
			return undefined;
		}
	},
	prepareCover: createCoverPreparer(renderPng),
};
