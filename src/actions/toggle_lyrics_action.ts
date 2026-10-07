import { streamDeck } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { setLyricsKeyState } from './set_lyrics_key_state';
import type { LyricsWatcher } from '../spotify/lyrics_watcher';
import { toggleSpotifyLyrics } from '../spotify/toggle_spotify_lyrics';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import { watchLyricsAvailability } from '../spotify/watch_lyrics_availability';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';

@action({ UUID: 'com.sonny93.spotify.toggle-lyrics' })
export class ToggleLyricsAction extends SingletonAction<BringToFrontSettings> {
	private watcher: LyricsWatcher | undefined;
	private isLyricsAvailable = false;

	override async onWillAppear(
		ev: WillAppearEvent<BringToFrontSettings>
	): Promise<void> {
		this.watcher ??= this.startWatcher();
		await setLyricsKeyState(ev.action, this.isLyricsAvailable);
	}

	override onWillDisappear(): void {
		if (this.actions.some(() => true)) {
			return;
		}
		this.watcher?.stop();
		this.watcher = undefined;
		this.isLyricsAvailable = false;
	}

	override async onKeyDown(
		ev: KeyDownEvent<BringToFrontSettings>
	): Promise<void> {
		if (!this.isLyricsAvailable) {
			return;
		}
		const shouldBringToFront = resolveBringToFront({
			rawSettings: ev.payload.settings,
			defaultValue: BringToFrontDefaults.lyrics,
		});
		await runSpotifyAction(
			ev.action,
			toggleSpotifyLyrics({ shouldBringToFront })
		);
	}

	private startWatcher(): LyricsWatcher {
		return watchLyricsAvailability({
			onChange: (isAvailable) => {
				this.isLyricsAvailable = isAvailable;
				void this.refreshVisibleKeys();
			},
			onError: (error) =>
				streamDeck.logger.debug('Lyrics watcher cannot reach Spotify', error),
		});
	}

	private async refreshVisibleKeys(): Promise<void> {
		try {
			await Promise.all(
				this.actions
					.toArray()
					.map((visibleAction) =>
						setLyricsKeyState(visibleAction, this.isLyricsAvailable)
					)
			);
		} catch (error) {
			streamDeck.logger.error('Cannot update the lyrics key state', error);
		}
	}
}
