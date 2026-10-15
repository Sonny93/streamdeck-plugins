/** What one frame of the "now playing" screen shows; `coverDataUrl` is `undefined` while the cover is not loaded. */
export type NowPlayingFrame = Readonly<{
	title: string;
	artistNames: readonly string[];
	coverDataUrl: string | undefined;
	positionMilliseconds: number;
	durationMilliseconds: number;
	isPaused: boolean;
}>;
