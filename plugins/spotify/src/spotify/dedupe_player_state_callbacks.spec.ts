import { describe, expect, it, vi } from 'vitest';

import type { SpotifyPlayerState } from './spotify_player_state';
import { dedupePlayerStateCallbacks } from './dedupe_player_state_callbacks';

const PLAYING: SpotifyPlayerState = {
	isPaused: false,
	trackUri: 'spotify:track:a',
	track: {
		title: 'A',
		artistNames: ['X'],
		imageUrl: undefined,
		durationMilliseconds: 200_000,
		positionMilliseconds: 1_000,
		positionTimestamp: 5_000,
		playbackSpeed: 1,
	},
};

function buildCallbacks() {
	return { onChange: vi.fn(), onError: vi.fn() };
}

describe('dedupePlayerStateCallbacks', () => {
	it('should forward the first state', () => {
		const callbacks = buildCallbacks();

		dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		).onChange(PLAYING);

		expect(callbacks.onChange).toHaveBeenCalledWith(PLAYING);
	});

	it('should forward an unreachable first state', () => {
		const callbacks = buildCallbacks();

		dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		).onChange(undefined);

		expect(callbacks.onChange).toHaveBeenCalledWith(undefined);
	});

	it('should skip a state equal to the previous one', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(PLAYING);
		deduped.onChange({ ...PLAYING });

		expect(callbacks.onChange).toHaveBeenCalledTimes(1);
	});

	it('should skip repeated unreachable states', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(undefined);
		deduped.onChange(undefined);

		expect(callbacks.onChange).toHaveBeenCalledTimes(1);
	});

	it('should forward a state with another paused flag', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(PLAYING);
		deduped.onChange({ ...PLAYING, isPaused: true });

		expect(callbacks.onChange).toHaveBeenLastCalledWith({
			...PLAYING,
			isPaused: true,
		});
	});

	it('should forward a state with another track', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(PLAYING);
		deduped.onChange({ ...PLAYING, trackUri: 'spotify:track:b' });

		expect(callbacks.onChange).toHaveBeenCalledTimes(2);
	});

	it('should forward a state where the playback position jumped', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(PLAYING);
		deduped.onChange({
			...PLAYING,
			track: PLAYING.track && { ...PLAYING.track, positionMilliseconds: 9 },
		});

		expect(callbacks.onChange).toHaveBeenCalledTimes(2);
	});

	it('should forward the unreachable state after a known one', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupePlayerStateCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(PLAYING);
		deduped.onChange(undefined);

		expect(callbacks.onChange).toHaveBeenLastCalledWith(undefined);
	});

	it('should not forward anything once the signal is aborted', () => {
		const callbacks = buildCallbacks();
		const controller = new AbortController();
		const deduped = dedupePlayerStateCallbacks(callbacks, controller.signal);

		controller.abort();
		deduped.onChange(PLAYING);

		expect(callbacks.onChange).not.toHaveBeenCalled();
	});
});
