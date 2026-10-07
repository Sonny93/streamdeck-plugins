import { streamDeck } from '@elgato/streamdeck';

import { PlaylistsDialTiming } from './playlists_dial_timing';
import { runSpotifyQuery } from '../spotify/run_spotify_query';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { listSpotifyPlaylists } from '../spotify/list_spotify_playlists';
import { SpotifyNotReachableError } from '../spotify/spotify_not_reachable_error';

/**
 * Cache of the playlists of the Spotify library, shared by every "Playlists" dial.
 * Refreshing never launches Spotify, never rejects, and shares one query between concurrent callers.
 * A failed refresh keeps the previous list, if any.
 */
export class PlaylistCatalog {
	private current: readonly SpotifyPlaylist[] = [];
	private fetchedAt: number | undefined;
	private refreshFailed = false;
	private refreshing: Promise<void> | undefined;

	/** The cached playlists, Liked Songs first; empty until a refresh succeeds. */
	get playlists(): readonly SpotifyPlaylist[] {
		return this.current;
	}

	/** Whether there is something to show: a cached list, or a failed refresh to report. */
	hasContent(): boolean {
		return this.current.length > 0 || this.refreshFailed;
	}

	/** Whether the list was never fetched, or is older than the maximum cache age. */
	isStale(): boolean {
		return (
			this.fetchedAt === undefined ||
			Date.now() - this.fetchedAt > PlaylistsDialTiming.cacheMaxAgeMilliseconds
		);
	}

	/** Fetches the playlists again; concurrent calls share the same query. Failures are logged, not thrown. */
	refresh(): Promise<void> {
		this.refreshing ??= this.load().finally(() => {
			this.refreshing = undefined;
		});
		return this.refreshing;
	}

	private async load(): Promise<void> {
		try {
			this.current = await runSpotifyQuery(listSpotifyPlaylists);
			this.fetchedAt = Date.now();
			this.refreshFailed = false;
		} catch (error) {
			this.refreshFailed = true;
			if (error instanceof SpotifyNotReachableError) {
				streamDeck.logger.debug('Spotify is closed, cannot list playlists');
				return;
			}
			streamDeck.logger.error('Cannot list the Spotify playlists', error);
		}
	}
}
