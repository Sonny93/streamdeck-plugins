import { streamDeck } from '@elgato/streamdeck';

import type { PlayerStateWatcher } from '../spotify/player_state_watcher';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';
import { watchPlayerState } from '../spotify/watch_player_state';

type PlayerStateListener = (state: SpotifyPlayerState | undefined) => void;

/**
 * Shares one Spotify player state watch between every action that needs it.
 * The watch starts with the first subscriber and stops with the last one.
 * A state of `undefined` means Spotify is unreachable.
 */
export class PlayerStateHub {
	private readonly listeners = new Set<PlayerStateListener>();
	private watcher: PlayerStateWatcher | undefined;
	private state: SpotifyPlayerState | undefined;

	/** Latest known player state, `undefined` while Spotify is unreachable or nobody is subscribed. */
	get current(): SpotifyPlayerState | undefined {
		return this.state;
	}

	/** Registers a listener, calls it right away with the current state, and returns the function that unsubscribes it. */
	subscribe(listener: PlayerStateListener): () => void {
		this.listeners.add(listener);
		this.watcher ??= this.startWatcher();
		listener(this.state);
		return () => this.unsubscribe(listener);
	}

	private unsubscribe(listener: PlayerStateListener): void {
		this.listeners.delete(listener);
		if (this.listeners.size > 0) {
			return;
		}
		this.watcher?.stop();
		this.watcher = undefined;
		this.state = undefined;
	}

	private startWatcher(): PlayerStateWatcher {
		return watchPlayerState({
			onChange: (state) => {
				this.state = state;
				for (const listener of this.listeners) {
					listener(state);
				}
			},
			onError: (error) =>
				streamDeck.logger.debug('Player watcher cannot reach Spotify', error),
		});
	}
}
