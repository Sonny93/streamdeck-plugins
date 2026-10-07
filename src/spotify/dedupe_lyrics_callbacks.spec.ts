import { describe, expect, it, vi } from 'vitest';

import { dedupeLyricsCallbacks } from './dedupe_lyrics_callbacks';

function buildCallbacks() {
	return { onChange: vi.fn(), onError: vi.fn() };
}

describe('dedupeLyricsCallbacks', () => {
	it('should forward the first value', () => {
		const callbacks = buildCallbacks();

		dedupeLyricsCallbacks(callbacks, new AbortController().signal).onChange(
			false
		);

		expect(callbacks.onChange).toHaveBeenCalledWith(false);
	});

	it('should skip a value equal to the previous one', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupeLyricsCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(true);
		deduped.onChange(true);

		expect(callbacks.onChange).toHaveBeenCalledTimes(1);
	});

	it('should forward a value different from the previous one', () => {
		const callbacks = buildCallbacks();
		const deduped = dedupeLyricsCallbacks(
			callbacks,
			new AbortController().signal
		);

		deduped.onChange(true);
		deduped.onChange(false);

		expect(callbacks.onChange).toHaveBeenLastCalledWith(false);
	});

	it('should not forward anything once the signal is aborted', () => {
		const callbacks = buildCallbacks();
		const controller = new AbortController();
		const deduped = dedupeLyricsCallbacks(callbacks, controller.signal);

		controller.abort();
		deduped.onChange(true);

		expect(callbacks.onChange).not.toHaveBeenCalled();
	});
});
