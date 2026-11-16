import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';

import { windowsAudioMixer } from '../audio/windows_audio_mixer';
import { activateProcessWindow } from '../windows/activate_process_window';
import { isProcessImageRunning } from '../windows/is_process_image_running';
import { isProcessInForeground } from '../windows/is_process_in_foreground';
import { killProcessImage } from '../windows/kill_process_image';
import { launchSpotify } from '../windows/launch_spotify';
import { stopWindowFlashing } from '../windows/stop_window_flashing';
import type { SpotifyHost } from './spotify_host';

const SPOTIFY_IMAGE_NAME = 'Spotify.exe';

/** The Windows host: the Microsoft Store Spotify, driven through tasklist, taskkill, user32 and Core Audio. */
export const windowsSpotifyHost: SpotifyHost = {
	spotifyImageName: SPOTIFY_IMAGE_NAME,
	launchSpotify,
	isSpotifyRunning: () => isProcessImageRunning(SPOTIFY_IMAGE_NAME),
	killSpotify: () => killProcessImage(SPOTIFY_IMAGE_NAME),
	isWindowInForeground: (target) => isProcessInForeground(target.processId),
	activateWindow: activateProcessWindow,
	stopWindowFlashing,
	audioMixer: windowsAudioMixer,
	encodeFrame: (svg) => Promise.resolve(toSvgDataUrl(svg)),
	prepareCover: (coverDataUrl) => Promise.resolve(coverDataUrl),
};
