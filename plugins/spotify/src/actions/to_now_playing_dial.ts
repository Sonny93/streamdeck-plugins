import type { NowPlayingDial } from './now_playing_dial';

type DialLike = Readonly<{
	id: string;
	coordinates: Readonly<{ column: number }>;
	setFeedback: (feedback: Readonly<Record<string, string>>) => Promise<void>;
}>;

/** Describes a dial of the plugin to the "now playing" screen: its id, its column, and how to send it feedback. */
export function toNowPlayingDial(dial: DialLike): NowPlayingDial {
	return {
		id: dial.id,
		column: dial.coordinates.column,
		setFeedback: (feedback) => dial.setFeedback(feedback),
	};
}
