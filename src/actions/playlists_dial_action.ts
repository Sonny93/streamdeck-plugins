import { streamDeck } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';
import type {
	DialAction,
	DialDownEvent,
	DialRotateEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import { wrapIndex } from './wrap_index';
import { CoverCache } from './cover_cache';
import { CoverLoader } from './cover_loader';
import { PlaylistCatalog } from './playlist_catalog';
import { scheduleTimeout } from './schedule_timeout';
import { readSelectedUri } from './read_selected_uri';
import { CarouselAnimator } from './carousel_animator';
import { runSpotifyAction } from './run_spotify_action';
import type { LikeTargetStore } from './like_target_store';
import { resolveSelectedIndex } from './resolve_selected_index';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import type { PlaylistsDialSettings } from './playlists_dial_settings';
import { playSpotifyPlaylist } from '../spotify/play_spotify_playlist';
import { PlaylistsCarouselRenderer } from './playlists_carousel_renderer';

type PlaylistsDial = DialAction<PlaylistsDialSettings>;

/**
 * Stream Deck+ dial that browses the playlists of the Spotify library as a carousel of covers.
 * Rotate to scroll, press to play the centered playlist, tap the touch strip to make it the "like" target.
 * The playlist list is cached and shared by every dial; each dial scrolls with its own animator and persists its own selection.
 * Listing never launches Spotify, while pressing the dial does.
 */
@action({ UUID: 'com.sonny93.spotify.playlists' })
export class PlaylistsDialAction extends SingletonAction<PlaylistsDialSettings> {
	private readonly selectedUris = new Map<string, string | undefined>();
	private readonly animators = new Map<string, CarouselAnimator>();
	private readonly catalog = new PlaylistCatalog();
	private readonly renderer: PlaylistsCarouselRenderer;
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly likeTargetStore: LikeTargetStore) {
		super();
		this.renderer = new PlaylistsCarouselRenderer({
			catalog: this.catalog,
			covers: new CoverLoader(new CoverCache()),
			likeTargetStore,
			onCoversLoaded: () => {
				void this.renderIdleDials();
			},
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		this.animators.get(ev.action.id)?.dispose();
		this.animators.set(ev.action.id, this.createAnimator(ev.action));
		this.selectedUris.set(ev.action.id, readSelectedUri(ev.payload.settings));
		this.jumpToSelection(ev.action.id);
		this.unsubscribe ??= this.likeTargetStore.subscribe(() => {
			void this.renderIdleDials();
		});
		await this.renderIdleDials();
		void this.refreshAndRender();
	}

	override onWillDisappear(
		ev: WillDisappearEvent<PlaylistsDialSettings>
	): void {
		this.animators.get(ev.action.id)?.dispose();
		this.animators.delete(ev.action.id);
		this.selectedUris.delete(ev.action.id);
		this.renderer.forget(ev.action.id);
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDialRotate(
		ev: DialRotateEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (this.catalog.playlists.length === 0) {
			await this.refreshAndRender();
			return;
		}
		this.animators.get(ev.action.id)?.retarget(ev.payload.ticks);
	}

	override async onDialDown(
		ev: DialDownEvent<PlaylistsDialSettings>
	): Promise<void> {
		const playlist = this.settledPlaylist(ev.action.id);
		if (playlist === undefined) {
			await ev.action.showAlert();
			return;
		}
		await runSpotifyAction(ev.action, playSpotifyPlaylist(playlist.uri));
	}

	override async onTouchTap(
		ev: TouchTapEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (ev.payload.hold) {
			return;
		}
		const playlist = this.settledPlaylist(ev.action.id);
		if (playlist === undefined || !playlist.canAdd) {
			await ev.action.showAlert();
			return;
		}
		try {
			await this.likeTargetStore.set({
				uri: playlist.uri,
				name: playlist.name,
				kind: playlist.kind,
			});
		} catch (error) {
			streamDeck.logger.error('Cannot set the like target', error);
			await ev.action.showAlert();
		}
	}

	private createAnimator(dial: PlaylistsDial): CarouselAnimator {
		return new CarouselAnimator({
			schedule: scheduleTimeout,
			onFrame: (position) =>
				this.renderer.renderAnimationFrame({ dial, position }),
			onSettled: (target) => {
				void this.settle(dial, target);
			},
			onError: (error) => {
				streamDeck.logger.error(
					'Cannot draw a playlists carousel frame',
					error
				);
			},
		});
	}

	private async settle(dial: PlaylistsDial, target: number): Promise<void> {
		const { playlists } = this.catalog;
		const index = wrapIndex({ index: target, length: playlists.length });
		const playlist = playlists[index];
		if (playlist === undefined) {
			return;
		}
		this.selectedUris.set(dial.id, playlist.uri);
		this.renderer.preload(index);
		try {
			await dial.setSettings({ selectedUri: playlist.uri });
		} catch (error) {
			streamDeck.logger.error('Cannot save the selected playlist', error);
		}
		if (this.catalog.isStale()) {
			void this.refreshAndRender();
		}
	}

	private settledPlaylist(dialId: string): SpotifyPlaylist | undefined {
		const animator = this.animators.get(dialId);
		return animator === undefined
			? undefined
			: this.catalog.playlists[
					animator.settledIndex(this.catalog.playlists.length)
				];
	}

	private jumpToSelection(dialId: string): void {
		this.animators.get(dialId)?.jumpTo(
			resolveSelectedIndex({
				playlists: this.catalog.playlists,
				selectedUri: this.selectedUris.get(dialId),
			})
		);
	}

	private idleDials(): PlaylistsDial[] {
		return this.actions
			.toArray()
			.filter(
				(candidate): candidate is PlaylistsDial =>
					candidate.isDial() &&
					this.animators.get(candidate.id)?.isAnimating === false
			);
	}

	private async renderIdleDials(): Promise<void> {
		try {
			await Promise.all(
				this.idleDials().map((dial) =>
					this.renderer.render({
						dial,
						position: this.animators.get(dial.id)?.currentPosition ?? 0,
					})
				)
			);
		} catch (error) {
			streamDeck.logger.error('Cannot update the playlists dials', error);
		}
	}

	private async refreshAndRender(): Promise<void> {
		await this.catalog.refresh();
		for (const dial of this.idleDials()) {
			this.jumpToSelection(dial.id);
		}
		await this.renderIdleDials();
	}
}
