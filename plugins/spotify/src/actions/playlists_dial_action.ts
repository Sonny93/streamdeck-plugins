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

import { isTrackInLikeTarget } from '../spotify/is_track_in_like_target';
import { playSpotifyPlaylist } from '../spotify/play_spotify_playlist';
import { runSpotifyQuery } from '../spotify/run_spotify_query';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { addPlayingTrackToPlaylist } from './add_playing_track_to_playlist';
import { CarouselAnimator } from './carousel_animator';
import { CoverCache } from './cover_cache';
import { CoverLoader } from './cover_loader';
import { DialPresence } from './dial_presence';
import type { LikeTargetStore } from './like_target_store';
import type { NowPlayingScreen } from './now_playing_screen';
import type { PlayerStateHub } from './player_state_hub';
import { PlaylistCatalog } from './playlist_catalog';
import { PlaylistsCarouselRenderer } from './playlists_carousel_renderer';
import type { PlaylistsDialSettings } from './playlists_dial_settings';
import { readSelectedUri } from './read_selected_uri';
import { resolveSelectedIndex } from './resolve_selected_index';
import { runSpotifyAction } from './run_spotify_action';
import { scheduleTimeout } from './schedule_timeout';
import { toNowPlayingDial } from './to_now_playing_dial';
import { wrapIndex } from './wrap_index';

type PlaylistsDial = DialAction<PlaylistsDialSettings>;

/**
 * Stream Deck+ dial that browses the playlists of the Spotify library as a carousel of covers.
 * Rotate to scroll, press to play the centered playlist, tap the touch strip to add the playing track to it (never twice).
 * A heart shows when the playing track is already in the centered playlist; the last playlist a track was added to becomes the "like" target.
 * The playlist list is cached and shared by every dial; each dial scrolls with its own animator and persists its own selection.
 * Listing and presence checks never launch Spotify, while pressing the dial or tapping the strip does.
 * While the Stream Deck is inactive and a track is loaded, the strip shows the playing track instead;
 * the first rotation, press or tap after that only brings the carousel back.
 */
@action({ UUID: 'com.sonny93.spotify.playlists' })
export class PlaylistsDialAction extends SingletonAction<PlaylistsDialSettings> {
	private readonly selectedUris = new Map<string, string | undefined>();
	private readonly animators = new Map<string, CarouselAnimator>();
	private readonly catalog = new PlaylistCatalog();
	private readonly presence: DialPresence;
	private readonly renderer: PlaylistsCarouselRenderer;
	private unsubscribe: (() => void) | undefined;

	constructor(
		private readonly playerStateHub: PlayerStateHub,
		private readonly likeTargetStore: LikeTargetStore,
		private readonly nowPlaying: NowPlayingScreen
	) {
		super();
		nowPlaying.onHidden(() => {
			void this.renderSettledDials();
		});
		nowPlaying.onBackdropChanged(() => {
			void this.renderSettledDials();
		});
		this.presence = new DialPresence({
			playerStateHub,
			query: (options) => runSpotifyQuery(isTrackInLikeTarget(options)),
			onChange: () => {
				void this.renderSettledDials();
			},
		});
		this.renderer = new PlaylistsCarouselRenderer({
			catalog: this.catalog,
			covers: new CoverLoader(new CoverCache()),
			presence: this.presence,
			readBackdropCover: () => nowPlaying.backdropCover,
			onCoversLoaded: () => {
				void this.renderSettledDials();
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
		this.presence.add(ev.action.id);
		this.jumpToSelection(ev.action.id);
		this.unsubscribe ??= this.playerStateHub.subscribe(() => {
			void this.presence.refreshAll();
		});
		this.nowPlaying.attach(toNowPlayingDial(ev.action));
		await this.renderSettledDials();
		void this.refreshAndRender();
	}

	override onWillDisappear(
		ev: WillDisappearEvent<PlaylistsDialSettings>
	): void {
		this.animators.get(ev.action.id)?.dispose();
		this.animators.delete(ev.action.id);
		this.selectedUris.delete(ev.action.id);
		this.presence.remove(ev.action.id);
		this.renderer.forget(ev.action.id);
		this.nowPlaying.detach(ev.action.id);
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDialRotate(
		ev: DialRotateEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (this.nowPlaying.wake()) {
			return;
		}
		if (this.catalog.playlists.length === 0) {
			await this.refreshAndRender();
			return;
		}
		this.animators.get(ev.action.id)?.retarget(ev.payload.ticks);
	}

	override async onDialDown(
		ev: DialDownEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (this.nowPlaying.wake()) {
			return;
		}
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
		if (this.nowPlaying.wake()) {
			return;
		}
		const isAdded = await addPlayingTrackToPlaylist({
			action: ev.action,
			hold: ev.payload.hold,
			playlist: this.settledPlaylist(ev.action.id),
			likeTargetStore: this.likeTargetStore,
		});
		if (isAdded) {
			this.presence.markAdded(ev.action.id);
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
		void this.presence.refresh(dial.id, playlist);
		void this.renderSettledDials();
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

	private dials(): PlaylistsDial[] {
		return this.actions
			.toArray()
			.filter((candidate): candidate is PlaylistsDial => candidate.isDial());
	}

	private settledDials(): PlaylistsDial[] {
		return this.dials().filter(
			(dial) => this.animators.get(dial.id)?.isAnimating === false
		);
	}

	private async renderSettledDials(): Promise<void> {
		try {
			if (this.nowPlaying.isShowing) {
				return;
			}
			await Promise.all(
				this.settledDials().map((dial) =>
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
		for (const dial of this.settledDials()) {
			this.jumpToSelection(dial.id);
			void this.presence.refresh(dial.id, this.settledPlaylist(dial.id));
		}
		await this.renderSettledDials();
	}
}
