/**
 * The track (or episode) loaded in the Spotify player, as shown on the "now playing" screen.
 * The position was measured at `positionTimestamp` (epoch milliseconds) and advances at `playbackSpeed` while playing.
 */
export type SpotifyPlayingTrack = Readonly<{
	title: string;
	artistNames: readonly string[];
	imageUrl: string | undefined;
	durationMilliseconds: number;
	positionMilliseconds: number;
	positionTimestamp: number;
	playbackSpeed: number;
}>;
