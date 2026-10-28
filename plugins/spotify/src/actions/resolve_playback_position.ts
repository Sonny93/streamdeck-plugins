import type { SpotifyPlayingTrack } from '../spotify/spotify_playing_track';

/**
 * Tells where the playback of a track is at `now` (epoch milliseconds): the measured position while paused,
 * otherwise the measured position advanced by the elapsed time at the playback speed, kept within the track.
 */
export function resolvePlaybackPosition(
	options: Readonly<{
		track: SpotifyPlayingTrack;
		isPaused: boolean;
		now: number;
	}>
): number {
	const { track } = options;
	const elapsed = options.isPaused
		? 0
		: (options.now - track.positionTimestamp) * track.playbackSpeed;
	const position = Math.max(0, track.positionMilliseconds + elapsed);
	return track.durationMilliseconds > 0
		? Math.min(position, track.durationMilliseconds)
		: position;
}
