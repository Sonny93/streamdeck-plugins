import type { NowPlayingLyrics } from './now_playing_lyrics';
import { findCurrentLyricIndex } from './find_current_lyric_index';
import type { SpotifyLyricsLine } from '../spotify/spotify_lyrics_line';

const INSTRUMENTAL_MARK = '♪';

function toShownWords(line: SpotifyLyricsLine | undefined): string {
	const words = line?.words.trim() ?? '';
	return words === '' ? INSTRUMENTAL_MARK : words;
}

/**
 * Picks the lyrics to show at `positionMilliseconds`: the line being sung and the next one.
 * Before the first line, and on a line without words, a note is shown instead; without lines there are no lyrics to show.
 */
export function buildNowPlayingLyrics(
	options: Readonly<{
		lines: readonly SpotifyLyricsLine[];
		positionMilliseconds: number;
	}>
): NowPlayingLyrics | undefined {
	if (options.lines.length === 0) {
		return undefined;
	}
	const index = findCurrentLyricIndex(options);
	const nextLine = options.lines[index + 1];
	return {
		current: toShownWords(options.lines[index]),
		next: nextLine === undefined ? undefined : toShownWords(nextLine),
	};
}
