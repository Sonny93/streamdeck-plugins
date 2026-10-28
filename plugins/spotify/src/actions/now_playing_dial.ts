/** A dial the "now playing" screen draws on: its id, its column on the touch strip (0 to 3), and how to send it a feedback image. */
export type NowPlayingDial = Readonly<{
	id: string;
	column: number;
	setFeedback: (feedback: Readonly<Record<string, string>>) => Promise<void>;
}>;
