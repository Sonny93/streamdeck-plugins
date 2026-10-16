import type { NowPlayingLyrics } from './now_playing_lyrics';

/** A change of lyric line being animated: the lyrics shown before, and how far the change is, eased, from 0 (start) to 1 (done). */
export type NowPlayingLyricsTransition = Readonly<{
	previous: NowPlayingLyrics;
	progress: number;
}>;
