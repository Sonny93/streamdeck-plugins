import { streamDeck } from '@elgato/streamdeck';

import type { SpotifyUiState } from '../spotify/spotify_ui_state';
import type { UiStateWatcher } from '../spotify/ui_state_watcher';
import { watchUiState } from '../spotify/watch_ui_state';

type UiStateListener = (state: SpotifyUiState | undefined) => void;

/**
 * Shares one watch of the Spotify window state (lyrics, full screen, search, focus) between every key that shows it.
 * The watch starts with the first subscriber and stops with the last one. A state of `undefined` means Spotify is unreachable.
 */
export class UiStateHub {
	private readonly listeners = new Set<UiStateListener>();
	private watcher: UiStateWatcher | undefined;
	private state: SpotifyUiState | undefined;

	/** Latest known window state, `undefined` while Spotify is unreachable or nobody is subscribed. */
	get current(): SpotifyUiState | undefined {
		return this.state;
	}

	/** Registers a listener, calls it right away with the current state, and returns the function that unsubscribes it. */
	subscribe(listener: UiStateListener): () => void {
		this.listeners.add(listener);
		this.watcher ??= this.startWatcher();
		listener(this.state);
		return () => this.unsubscribe(listener);
	}

	private unsubscribe(listener: UiStateListener): void {
		this.listeners.delete(listener);
		if (this.listeners.size > 0) {
			return;
		}
		this.watcher?.stop();
		this.watcher = undefined;
		this.state = undefined;
	}

	private startWatcher(): UiStateWatcher {
		return watchUiState({
			onChange: (state) => {
				this.state = state;
				for (const listener of this.listeners) {
					listener(state);
				}
			},
			onError: (error) =>
				streamDeck.logger.debug(
					'Window state watcher cannot reach Spotify',
					error
				),
		});
	}
}
