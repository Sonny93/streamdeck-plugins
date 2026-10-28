import type { LikeTargetRef } from '../spotify/like_target_ref';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import type { DialPresenceOptions } from './dial_presence_options';
import { LikePresenceTracker } from './like_presence_tracker';

function toTargetRef(playlist: SpotifyPlaylist): LikeTargetRef {
	return { uri: playlist.uri, kind: playlist.kind };
}

/**
 * Tells, for each "Playlists" dial, whether the playing track is already in the playlist the dial is centered on.
 * Each dial has its own presence tracker, so a result is only reported for the playlist it was computed for.
 */
export class DialPresence {
	private readonly trackers = new Map<string, LikePresenceTracker>();
	private readonly centered = new Map<string, SpotifyPlaylist>();

	constructor(private readonly options: DialPresenceOptions) {}

	/** Starts tracking a dial that appeared. */
	add(dialId: string): void {
		this.trackers.set(
			dialId,
			new LikePresenceTracker({
				query: this.options.query,
				onChange: () => {
					this.options.onChange(dialId);
				},
			})
		);
	}

	/** Stops tracking a dial that disappeared. */
	remove(dialId: string): void {
		this.trackers.delete(dialId);
		this.centered.delete(dialId);
	}

	/** Whether the playing track is known to be in the playlist; false for any other playlist than the one last refreshed. */
	contains(dialId: string, playlist: SpotifyPlaylist): boolean {
		return (
			this.trackers.get(dialId)?.isInTargetFor(toTargetRef(playlist)) ?? false
		);
	}

	/** Checks the playing track against the playlist a dial is now centered on; `undefined` means the dial shows no playlist. */
	async refresh(
		dialId: string,
		playlist: SpotifyPlaylist | undefined
	): Promise<void> {
		if (playlist === undefined) {
			this.centered.delete(dialId);
			return;
		}
		this.centered.set(dialId, playlist);
		await this.trackers.get(dialId)?.refresh({
			trackUri: this.options.playerStateHub.current?.trackUri,
			target: toTargetRef(playlist),
		});
	}

	/** Checks the playing track again for every dial, after the track changed. */
	async refreshAll(): Promise<void> {
		await Promise.all(
			[...this.centered].map(([dialId, playlist]) =>
				this.refresh(dialId, playlist)
			)
		);
	}

	/** Records that the playing track was just added to the playlist a dial is centered on. */
	markAdded(dialId: string): void {
		this.trackers.get(dialId)?.markInTarget();
	}
}
