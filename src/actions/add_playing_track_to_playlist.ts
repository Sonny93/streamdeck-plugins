import { streamDeck } from '@elgato/streamdeck';
import type { TouchTapEvent } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import type { LikeTargetStore } from './like_target_store';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { addCurrentTrackToLikeTarget } from '../spotify/add_current_track_to_like_target';

type AddPlayingTrackOptions = Readonly<{
	action: Pick<TouchTapEvent['action'], 'manifestId' | 'showAlert'>;
	hold: boolean;
	playlist: SpotifyPlaylist | undefined;
	likeTargetStore: Pick<LikeTargetStore, 'set'>;
}>;

/**
 * Handles a touch tap of the "Playlists" dial: adds the playing track to the centered playlist, unless it is already there.
 * A hold does nothing; a missing or read-only playlist shows an alert and sends nothing.
 * Once the track is in, the playlist becomes the like target. Resolves to whether the track is now in the playlist.
 */
export async function addPlayingTrackToPlaylist(
	options: AddPlayingTrackOptions
): Promise<boolean> {
	const { action, playlist } = options;
	if (options.hold) {
		return false;
	}
	if (playlist === undefined || !playlist.canAdd) {
		await action.showAlert();
		return false;
	}
	const isDone = await runSpotifyAction(
		action,
		addCurrentTrackToLikeTarget({ uri: playlist.uri, kind: playlist.kind })
	);
	if (!isDone) {
		return false;
	}
	try {
		await options.likeTargetStore.set({
			uri: playlist.uri,
			name: playlist.name,
			kind: playlist.kind,
		});
	} catch (error) {
		streamDeck.logger.error('Cannot set the like target', error);
	}
	return true;
}
