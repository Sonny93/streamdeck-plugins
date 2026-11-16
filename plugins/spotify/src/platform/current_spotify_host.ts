import type { SpotifyHost } from './spotify_host';
import { SpotifyHostNotLoadedError } from './spotify_host_not_loaded_error';

let host: SpotifyHost | undefined;

/** Holds the host chosen at plugin startup, for the one place that cannot receive it from its caller: running a command from a key press. */
export const CurrentSpotifyHost = {
	provide(provided: SpotifyHost): void {
		host = provided;
	},
	require(): SpotifyHost {
		if (host === undefined) {
			throw new SpotifyHostNotLoadedError();
		}
		return host;
	},
} as const;
