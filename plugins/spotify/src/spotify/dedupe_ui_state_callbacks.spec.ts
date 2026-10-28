import { describe, expect, it, vi } from 'vitest';

import type { SpotifyUiState } from './spotify_ui_state';
import { dedupeUiStateCallbacks } from './dedupe_ui_state_callbacks';

const STATE: SpotifyUiState = {
	isLyricsAvailable: true,
	isLyricsOpen: false,
	isFullscreen: false,
	isSearchOpen: false,
	isFocused: false,
};

function buildDeduped(signal = new AbortController().signal) {
	const callbacks = { onChange: vi.fn(), onError: vi.fn() };
	return { callbacks, deduped: dedupeUiStateCallbacks(callbacks, signal) };
}

describe('dedupeUiStateCallbacks', () => {
	it('should forward the first state', () => {
		const { callbacks, deduped } = buildDeduped();

		deduped.onChange(STATE);

		expect(callbacks.onChange).toHaveBeenCalledWith(STATE);
	});

	it('should forward an unreachable first state', () => {
		const { callbacks, deduped } = buildDeduped();

		deduped.onChange(undefined);

		expect(callbacks.onChange).toHaveBeenCalledWith(undefined);
	});

	it('should skip a state equal to the previous one', () => {
		const { callbacks, deduped } = buildDeduped();

		deduped.onChange(STATE);
		deduped.onChange({ ...STATE });

		expect(callbacks.onChange).toHaveBeenCalledTimes(1);
	});

	it('should forward a state that changed', () => {
		const { callbacks, deduped } = buildDeduped();

		deduped.onChange(STATE);
		deduped.onChange({ ...STATE, isFocused: true });

		expect(callbacks.onChange).toHaveBeenCalledTimes(2);
	});

	it('should not forward anything once the signal is aborted', () => {
		const controller = new AbortController();
		const { callbacks, deduped } = buildDeduped(controller.signal);

		controller.abort();
		deduped.onChange(STATE);

		expect(callbacks.onChange).not.toHaveBeenCalled();
	});
});
