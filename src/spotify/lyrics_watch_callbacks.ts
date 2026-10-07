/** Callbacks through which a lyrics availability watch reports back to its owner. */
export type LyricsWatchCallbacks = Readonly<{
	onChange: (isAvailable: boolean) => void;
	onError: (error: unknown) => void;
}>;
