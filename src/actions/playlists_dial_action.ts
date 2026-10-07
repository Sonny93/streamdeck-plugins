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

import { CoverCache } from './cover_cache';
import { moveSelection } from './move_selection';
import { PlaylistCatalog } from './playlist_catalog';
import { readSelectedUri } from './read_selected_uri';
import { runSpotifyAction } from './run_spotify_action';
import type { LikeTargetStore } from './like_target_store';
import { resolveSelectedIndex } from './resolve_selected_index';
import { buildPlaylistFeedback } from './build_playlist_feedback';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import type { PlaylistsDialSettings } from './playlists_dial_settings';
import { playSpotifyPlaylist } from '../spotify/play_spotify_playlist';

type PlaylistsDial = DialAction<PlaylistsDialSettings>;

type LocatedPlaylist = Readonly<{
	index: number;
	playlist: SpotifyPlaylist | undefined;
}>;

/**
 * Stream Deck+ dial that browses the playlists of the Spotify library.
 * Rotate to browse, press to play the shown playlist, tap the touch strip to make it the "like" target.
 * The playlist list is cached and shared by every dial; each dial persists its own selection.
 * Listing never launches Spotify, while pressing the dial does.
 */
@action({ UUID: 'com.sonny93.spotify.playlists' })
export class PlaylistsDialAction extends SingletonAction<PlaylistsDialSettings> {
	private readonly selectedUris = new Map<string, string | undefined>();
	private readonly catalog = new PlaylistCatalog();
	private readonly covers = new CoverCache();
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly likeTargetStore: LikeTargetStore) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<PlaylistsDialSettings>
	): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		this.selectedUris.set(ev.action.id, readSelectedUri(ev.payload.settings));
		this.unsubscribe ??= this.likeTargetStore.subscribe(() => {
			void this.renderVisibleDials();
		});
		await this.render(ev.action);
		void this.refreshAndRender();
	}

	override onWillDisappear(
		ev: WillDisappearEvent<PlaylistsDialSettings>
	): void {
		this.selectedUris.delete(ev.action.id);
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
		const next =
			this.catalog.playlists[
				moveSelection({
					index: this.locate(ev.action.id).index,
					ticks: ev.payload.ticks,
					length: this.catalog.playlists.length,
				})
			];
		if (next === undefined) {
			return;
		}
		this.selectedUris.set(ev.action.id, next.uri);
		await Promise.all([
			this.render(ev.action),
			ev.action.setSettings({ selectedUri: next.uri }),
		]);
		if (this.catalog.isStale()) {
			void this.refreshAndRender();
		}
	}

	override async onDialDown(
		ev: DialDownEvent<PlaylistsDialSettings>
	): Promise<void> {
		const { playlist } = this.locate(ev.action.id);
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
		const { playlist } = this.locate(ev.action.id);
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

	private locate(actionId: string): LocatedPlaylist {
		const index = resolveSelectedIndex({
			playlists: this.catalog.playlists,
			selectedUri: this.selectedUris.get(actionId),
		});
		return { index, playlist: this.catalog.playlists[index] };
	}

	private visibleDials(): PlaylistsDial[] {
		return this.actions.toArray().filter((candidate) => candidate.isDial());
	}

	private async render(dial: PlaylistsDial): Promise<void> {
		if (!this.catalog.hasContent()) {
			return;
		}
		const { index, playlist } = this.locate(dial.id);
		const coverUrl = playlist?.imageUrl;
		const coverDataUrl =
			coverUrl === undefined ? undefined : this.covers.get(coverUrl);
		await dial.setFeedback(
			buildPlaylistFeedback({
				playlist,
				index,
				total: this.catalog.playlists.length,
				isLikeTarget:
					playlist !== undefined &&
					playlist.uri === this.likeTargetStore.current?.uri,
				coverDataUrl,
			})
		);
		if (coverUrl !== undefined && coverDataUrl === undefined) {
			void this.showCoverWhenLoaded(dial, coverUrl);
		}
	}

	private async renderVisibleDials(): Promise<void> {
		try {
			await Promise.all(this.visibleDials().map((dial) => this.render(dial)));
		} catch (error) {
			streamDeck.logger.error('Cannot update the playlists dials', error);
		}
	}

	private async showCoverWhenLoaded(
		dial: PlaylistsDial,
		coverUrl: string
	): Promise<void> {
		try {
			await this.covers.load(coverUrl);
			if (this.locate(dial.id).playlist?.imageUrl === coverUrl) {
				await this.render(dial);
			}
		} catch (error) {
			streamDeck.logger.debug('Cannot show a playlist cover', error);
		}
	}

	private async refreshAndRender(): Promise<void> {
		await this.catalog.refresh();
		await this.renderVisibleDials();
	}
}
