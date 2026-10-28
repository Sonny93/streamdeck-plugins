import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SpotifyUiState } from '../spotify/spotify_ui_state';
import type { UiStateWatchCallbacks } from '../spotify/ui_state_watch_callbacks';
import { watchUiState } from '../spotify/watch_ui_state';
import { UiStateHub } from './ui_state_hub';

vi.mock('../spotify/watch_ui_state');
vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const FOCUSED: SpotifyUiState = {
	isLyricsAvailable: true,
	isLyricsOpen: false,
	isFullscreen: false,
	isSearchOpen: false,
	isFocused: true,
};

function mockWatcher() {
	const stop = vi.fn();
	const captured: { callbacks?: UiStateWatchCallbacks } = {};
	vi.mocked(watchUiState).mockImplementation((callbacks) => {
		captured.callbacks = callbacks;
		return { stop };
	});
	return {
		stop,
		emit: (state: SpotifyUiState | undefined): void =>
			captured.callbacks?.onChange(state),
	};
}

describe('UiStateHub', () => {
	beforeEach(() => {
		vi.mocked(watchUiState).mockReset();
	});

	it('should start the watcher once for several subscribers', () => {
		mockWatcher();
		const hub = new UiStateHub();

		hub.subscribe(vi.fn());
		hub.subscribe(vi.fn());

		expect(watchUiState).toHaveBeenCalledTimes(1);
	});

	it('should stop the watcher when the last subscriber unsubscribes', () => {
		const watcher = mockWatcher();
		const hub = new UiStateHub();
		const unsubscribeFirst = hub.subscribe(vi.fn());
		const unsubscribeSecond = hub.subscribe(vi.fn());

		unsubscribeFirst();
		expect(watcher.stop).not.toHaveBeenCalled();
		unsubscribeSecond();

		expect(watcher.stop).toHaveBeenCalledTimes(1);
	});

	it('should notify subscribers and expose the latest state', () => {
		const watcher = mockWatcher();
		const hub = new UiStateHub();
		const listener = vi.fn();
		hub.subscribe(listener);

		watcher.emit(FOCUSED);

		expect(listener).toHaveBeenLastCalledWith(FOCUSED);
		expect(hub.current).toEqual(FOCUSED);
	});

	it('should give the current state to a late subscriber', () => {
		const watcher = mockWatcher();
		const hub = new UiStateHub();
		hub.subscribe(vi.fn());
		watcher.emit(FOCUSED);
		const lateListener = vi.fn();

		hub.subscribe(lateListener);

		expect(lateListener).toHaveBeenCalledWith(FOCUSED);
	});

	it('should reset the current state when the last subscriber unsubscribes', () => {
		const watcher = mockWatcher();
		const hub = new UiStateHub();
		const unsubscribe = hub.subscribe(vi.fn());
		watcher.emit(FOCUSED);

		unsubscribe();

		expect(hub.current).toBeUndefined();
	});
});
