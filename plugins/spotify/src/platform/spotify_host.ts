import type { AudioMixer } from '../audio/audio_mixer';
import type { FrameEncoder } from './frame_encoder';
import type { SpotifyWindowTarget } from './spotify_window_target';

/** Everything the plugin needs from the operating system to run Spotify: its process, its window and the per-app volume. */
export type SpotifyHost = Readonly<{
	spotifyImageName: string;
	launchSpotify: () => Promise<void>;
	isSpotifyRunning: () => Promise<boolean>;
	killSpotify: () => Promise<void>;
	isWindowInForeground: (target: SpotifyWindowTarget) => Promise<boolean>;
	activateWindow: (processId: number) => Promise<void>;
	stopWindowFlashing: (processId: number) => Promise<void>;
	audioMixer: AudioMixer;
	encodeFrame: FrameEncoder;
	prepareCover: (coverDataUrl: string) => Promise<string>;
}>;
