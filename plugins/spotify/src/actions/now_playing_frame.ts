import type { NowPlayingLyrics } from './now_playing_lyrics';
import type { NowPlayingLyricsTransition } from './now_playing_lyrics_transition';

/**
 * What one frame of the "now playing" screen shows; `coverDataUrl` is `undefined` while the cover is not loaded,
 * `lyrics` is `undefined` when the track has no synced lyrics (or they are not loaded),
 * and `lyricsTransition` is set while a change of line is being animated.
 */
export type NowPlayingFrame = Readonly<{
	title: string;
	artistNames: readonly string[];
	coverDataUrl: string | undefined;
	lyrics: NowPlayingLyrics | undefined;
	lyricsTransition: NowPlayingLyricsTransition | undefined;
	positionMilliseconds: number;
	durationMilliseconds: number;
	isPaused: boolean;
}>;
