/** What a "Listen" dial shows about its input, before it is drawn. */
export type ListenStripModel = Readonly<{
	/** The name of the input, or what stands for it when there is none. */
	title: string;
	/** The level in percent, with one decimal when needed; empty while the dial is unavailable. */
	levelText: string;
	/** "Listening" or "Off" while the input is available, empty otherwise. */
	stateText: string;
	/** The big message of an unavailable dial, empty otherwise. */
	messageText: string;
	/** The level against the ceiling, 0 to 1. */
	barFraction: number;
	isListening: boolean;
	isAvailable: boolean;
}>;
