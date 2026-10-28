import type { SpotifyLyricsLine } from '../spotify/spotify_lyrics_line';

/** Tells which line of synced lyrics (sorted by start) is sung at `positionMilliseconds`: the last one already started, or -1 before the first one. */
export function findCurrentLyricIndex(
	options: Readonly<{
		lines: readonly SpotifyLyricsLine[];
		positionMilliseconds: number;
	}>
): number {
	return options.lines.findLastIndex(
		(line) => line.startMilliseconds <= options.positionMilliseconds
	);
}
