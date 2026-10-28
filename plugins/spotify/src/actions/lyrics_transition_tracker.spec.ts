import { describe, expect, it } from 'vitest';

import { LyricsTransitionTracker } from './lyrics_transition_tracker';

const DURATION = 300;
const FIRST = { current: 'Hola', next: 'Adiós' };
const SECOND = { current: 'Adiós', next: undefined };

function follow(
	tracker: LyricsTransitionTracker,
	options: Readonly<{
		index: number;
		now: number;
		trackUri?: string;
		lyrics?: typeof FIRST | typeof SECOND;
	}>
) {
	return tracker.follow({
		trackUri: options.trackUri ?? 'spotify:track:a',
		index: options.index,
		lyrics: options.lyrics ?? (options.index === 0 ? FIRST : SECOND),
		now: options.now,
	});
}

describe('LyricsTransitionTracker', () => {
	it('should not animate the first lyrics shown', () => {
		const tracker = new LyricsTransitionTracker(DURATION);

		expect(follow(tracker, { index: 0, now: 0 })).toBeUndefined();
		expect(tracker.isAnimating).toBe(false);
	});

	it('should animate the move to the next line from the lyrics shown before', () => {
		const tracker = new LyricsTransitionTracker(DURATION);
		follow(tracker, { index: 0, now: 0 });

		expect(follow(tracker, { index: 1, now: 1_000 })).toEqual({
			previous: FIRST,
			progress: 0,
		});
		expect(tracker.isAnimating).toBe(true);
	});

	it('should ease the progress out over the duration', () => {
		const tracker = new LyricsTransitionTracker(DURATION);
		follow(tracker, { index: 0, now: 0 });
		follow(tracker, { index: 1, now: 1_000 });

		expect(follow(tracker, { index: 1, now: 1_150 })?.progress).toBe(0.875);
	});

	it('should end once the duration has passed', () => {
		const tracker = new LyricsTransitionTracker(DURATION);
		follow(tracker, { index: 0, now: 0 });
		follow(tracker, { index: 1, now: 1_000 });

		expect(follow(tracker, { index: 1, now: 1_300 })).toBeUndefined();
		expect(tracker.isAnimating).toBe(false);
	});

	it('should not animate a jump over several lines', () => {
		const tracker = new LyricsTransitionTracker(DURATION);
		follow(tracker, { index: 0, now: 0 });

		expect(follow(tracker, { index: 3, now: 1_000 })).toBeUndefined();
	});

	it('should not animate the lyrics of another track', () => {
		const tracker = new LyricsTransitionTracker(DURATION);
		follow(tracker, { index: 0, now: 0 });

		expect(
			follow(tracker, { index: 1, now: 1_000, trackUri: 'spotify:track:b' })
		).toBeUndefined();
	});
});
