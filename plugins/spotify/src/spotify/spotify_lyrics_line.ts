/** One line of a track's synced lyrics: the words, and when they start in the track (milliseconds). */
export type SpotifyLyricsLine = Readonly<{
	startMilliseconds: number;
	words: string;
}>;
