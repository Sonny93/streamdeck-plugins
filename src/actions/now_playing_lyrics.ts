/** The lyrics shown on the "now playing" screen: the line being sung and, when there is one, the line after it. */
export type NowPlayingLyrics = Readonly<{
	current: string;
	next: string | undefined;
}>;
