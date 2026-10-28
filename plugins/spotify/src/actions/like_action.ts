import { streamDeck } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { addCurrentTrackToLikeTarget } from '../spotify/add_current_track_to_like_target';
import { isTrackInLikeTarget } from '../spotify/is_track_in_like_target';
import { runSpotifyQuery } from '../spotify/run_spotify_query';
import { DefaultLikeTarget } from './default_like_target';
import { LikePresenceTracker } from './like_presence_tracker';
import type { LikeTarget } from './like_target';
import type { LikeTargetStore } from './like_target_store';
import type { PlayerStateHub } from './player_state_hub';
import { runSpotifyAction } from './run_spotify_action';
import { setLikeKeyState } from './set_like_key_state';

type VisibleAction = WillAppearEvent['action'];

/**
 * Key that adds the playing track to the like target picked on the Playlists dial, Liked Songs by default.
 * The key title is the target name, and the key state tells whether the playing track is already in the target.
 * Presence checks never launch Spotify, while pressing the key does.
 */
@action({ UUID: 'com.sonny93.spotify.like' })
export class LikeAction extends SingletonAction {
	private readonly presence = new LikePresenceTracker({
		query: (options) => runSpotifyQuery(isTrackInLikeTarget(options)),
		onChange: (isInTarget) => {
			void this.showState(isInTarget);
		},
	});
	private unsubscribes: (() => void)[] | undefined;
	private trackUri: string | undefined;

	constructor(
		private readonly playerStateHub: PlayerStateHub,
		private readonly likeTargetStore: LikeTargetStore
	) {
		super();
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		this.unsubscribes ??= [
			this.playerStateHub.subscribe((state) => {
				this.trackUri = state?.trackUri;
				void this.refreshPresence();
			}),
			this.likeTargetStore.subscribe(() => {
				void this.showTitle();
				void this.refreshPresence();
			}),
		];
		await Promise.all([
			this.setTitle(ev.action),
			setLikeKeyState(ev.action, this.presence.isInTarget),
		]);
	}

	override onWillDisappear(): void {
		if (this.actions.some(() => true)) {
			return;
		}
		for (const unsubscribe of this.unsubscribes ?? []) {
			unsubscribe();
		}
		this.unsubscribes = undefined;
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const isDone = await runSpotifyAction(
			ev.action,
			addCurrentTrackToLikeTarget(this.target())
		);
		if (!isDone) {
			return;
		}
		await ev.action.showOk();
		this.presence.markInTarget();
	}

	private target(): LikeTarget | typeof DefaultLikeTarget {
		return this.likeTargetStore.current ?? DefaultLikeTarget;
	}

	private async refreshPresence(): Promise<void> {
		await this.presence.refresh({
			trackUri: this.trackUri,
			target: this.target(),
		});
	}

	private async setTitle(visibleAction: VisibleAction): Promise<void> {
		if (visibleAction.isKey()) {
			await visibleAction.setTitle(this.target().name);
		}
	}

	private async showTitle(): Promise<void> {
		await this.updateVisibleKeys('title', (visibleAction) =>
			this.setTitle(visibleAction)
		);
	}

	private async showState(isInTarget: boolean): Promise<void> {
		await this.updateVisibleKeys('state', (visibleAction) =>
			setLikeKeyState(visibleAction, isInTarget)
		);
	}

	private async updateVisibleKeys(
		what: string,
		update: (visibleAction: VisibleAction) => Promise<void>
	): Promise<void> {
		try {
			await Promise.all(this.actions.toArray().map(update));
		} catch (error) {
			streamDeck.logger.error(`Cannot update the like key ${what}`, error);
		}
	}
}
