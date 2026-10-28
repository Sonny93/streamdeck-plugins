import type { NowPlayingLyrics } from './now_playing_lyrics';
import type { NowPlayingLyricsTransition } from './now_playing_lyrics_transition';

const EASE_POWER = 3;

type ShownLyrics = Readonly<{
	trackUri: string;
	index: number;
	lyrics: NowPlayingLyrics;
}>;

type RunningTransition = Readonly<{
	previous: NowPlayingLyrics;
	startedAt: number;
}>;

function easeOut(ratio: number): number {
	return 1 - (1 - ratio) ** EASE_POWER;
}

/**
 * Follows the lyric line shown on the "now playing" screen and tells when to animate a change of line.
 * Only moving on to the very next line of the same track animates; a new track, a seek or lyrics that just loaded show at once.
 * The animation lasts `durationMilliseconds` from the first frame that shows the new line.
 */
export class LyricsTransitionTracker {
	private shown: ShownLyrics | undefined;
	private transition: RunningTransition | undefined;

	constructor(private readonly durationMilliseconds: number) {}

	/** Whether a change of line is still being animated, as of the last call to `follow`. */
	get isAnimating(): boolean {
		return this.transition !== undefined;
	}

	/** Records the lyrics about to be drawn at `now` (`index` being their line) and returns the change of line to draw with them, while it lasts. */
	follow(
		options: Readonly<{
			trackUri: string | undefined;
			index: number;
			lyrics: NowPlayingLyrics | undefined;
			now: number;
		}>
	): NowPlayingLyricsTransition | undefined {
		const { trackUri, index, lyrics, now } = options;
		if (trackUri === undefined || lyrics === undefined) {
			this.shown = undefined;
			this.transition = undefined;
			return undefined;
		}
		const { shown } = this;
		if (shown?.trackUri !== trackUri || shown.index !== index) {
			const isNextLine =
				shown?.trackUri === trackUri && index === shown.index + 1;
			this.transition = isNextLine
				? { previous: shown.lyrics, startedAt: now }
				: undefined;
			this.shown = { trackUri, index, lyrics };
		}
		return this.readTransition(now);
	}

	private readTransition(now: number): NowPlayingLyricsTransition | undefined {
		if (this.transition === undefined) {
			return undefined;
		}
		const ratio = (now - this.transition.startedAt) / this.durationMilliseconds;
		if (ratio >= 1) {
			this.transition = undefined;
			return undefined;
		}
		return {
			previous: this.transition.previous,
			progress: easeOut(Math.max(0, ratio)),
		};
	}
}
