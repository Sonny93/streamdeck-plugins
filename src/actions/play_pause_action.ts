import { streamDeck } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import type { PlayerStateHub } from './player_state_hub';
import { setPlayPauseKeyState } from './set_play_pause_key_state';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';
import { toggleSpotifyPlayback } from '../spotify/toggle_spotify_playback';

@action({ UUID: 'com.sonny93.spotify.play-pause' })
export class PlayPauseAction extends SingletonAction {
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly playerStateHub: PlayerStateHub) {
		super();
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		this.unsubscribe ??= this.playerStateHub.subscribe((state) => {
			void this.refreshVisibleKeys(state);
		});
		await setPlayPauseKeyState(ev.action, this.playerStateHub.current);
	}

	override onWillDisappear(): void {
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, toggleSpotifyPlayback);
	}

	private async refreshVisibleKeys(
		state: SpotifyPlayerState | undefined
	): Promise<void> {
		try {
			await Promise.all(
				this.actions
					.toArray()
					.map((visibleAction) => setPlayPauseKeyState(visibleAction, state))
			);
		} catch (error) {
			streamDeck.logger.error('Cannot update the play/pause key state', error);
		}
	}
}
