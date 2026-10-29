import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerStateWatchCallbacks } from '../spotify/player_state_watch_callbacks';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';
import { watchPlayerState } from '../spotify/watch_player_state';
import { PlayerStateHub } from './player_state_hub';

vi.mock('../spotify/watch_player_state');
vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const PLAYING: SpotifyPlayerState = {
	isPaused: false,
	trackUri: 'spotify:track:a',
	track: undefined,
	activeDeviceId: undefined,
};

function mockWatcher() {
	const stop = vi.fn();
	const captured: { callbacks?: PlayerStateWatchCallbacks } = {};
	vi.mocked(watchPlayerState).mockImplementation((callbacks) => {
		captured.callbacks = callbacks;
		return { stop };
	});
	return {
		stop,
		emit: (state: SpotifyPlayerState | undefined): void =>
			captured.callbacks?.onChange(state),
	};
}

describe('PlayerStateHub', () => {
	beforeEach(() => {
		vi.mocked(watchPlayerState).mockReset();
	});

	it('should start the watcher once for several subscribers', () => {
		mockWatcher();
		const hub = new PlayerStateHub();

		hub.subscribe(vi.fn());
		hub.subscribe(vi.fn());

		expect(watchPlayerState).toHaveBeenCalledTimes(1);
	});

	it('should not stop the watcher while a subscriber remains', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		const unsubscribeFirst = hub.subscribe(vi.fn());
		hub.subscribe(vi.fn());

		unsubscribeFirst();

		expect(watcher.stop).not.toHaveBeenCalled();
	});

	it('should stop the watcher when the last subscriber unsubscribes', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		const unsubscribeFirst = hub.subscribe(vi.fn());
		const unsubscribeSecond = hub.subscribe(vi.fn());

		unsubscribeFirst();
		unsubscribeSecond();

		expect(watcher.stop).toHaveBeenCalledTimes(1);
	});

	it('should restart the watcher on a new subscription after it stopped', () => {
		mockWatcher();
		const hub = new PlayerStateHub();
		hub.subscribe(vi.fn())();

		hub.subscribe(vi.fn());

		expect(watchPlayerState).toHaveBeenCalledTimes(2);
	});

	it('should notify subscribers when the state changes', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		const listener = vi.fn();
		hub.subscribe(listener);

		watcher.emit(PLAYING);

		expect(listener).toHaveBeenLastCalledWith(PLAYING);
	});

	it('should expose the latest state as current', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		hub.subscribe(vi.fn());

		watcher.emit(PLAYING);

		expect(hub.current).toEqual(PLAYING);
	});

	it('should give the current state to a late subscriber', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		hub.subscribe(vi.fn());
		watcher.emit(PLAYING);
		const lateListener = vi.fn();

		hub.subscribe(lateListener);

		expect(lateListener).toHaveBeenCalledWith(PLAYING);
	});

	it('should not notify a listener that unsubscribed', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		hub.subscribe(vi.fn());
		const listener = vi.fn();
		const unsubscribe = hub.subscribe(listener);
		unsubscribe();
		listener.mockClear();

		watcher.emit(PLAYING);

		expect(listener).not.toHaveBeenCalled();
	});

	it('should reset the current state when the last subscriber unsubscribes', () => {
		const watcher = mockWatcher();
		const hub = new PlayerStateHub();
		const unsubscribe = hub.subscribe(vi.fn());
		watcher.emit(PLAYING);

		unsubscribe();

		expect(hub.current).toBeUndefined();
	});
});
