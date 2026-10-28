import { buildTrackPresenceSnippet } from './build_track_presence_snippet';
import type { LikeTargetRef } from './like_target_ref';
import { parseAddTrackOutcome } from './parse_add_track_outcome';
import { runPlatformScript } from './run_platform_script';
import { SpotifyAddTrackOutcome } from './spotify_add_track_outcome';
import type { SpotifyCommand } from './spotify_command';
import { SpotifyPlaylistKind } from './spotify_playlist_kind';
import { SpotifyServices } from './spotify_services';

function buildBody(target: LikeTargetRef): string {
	return `
		${buildTrackPresenceSnippet()}
		const target = ${JSON.stringify({ uri: target.uri, kind: target.kind })};
		const state = await resolve(${JSON.stringify(SpotifyServices.player)}).getState();
		const trackUri = state.item?.uri;
		if (!trackUri) { return { outcome: ${JSON.stringify(SpotifyAddTrackOutcome.noTrack)} }; }
		if (await isTrackInTarget(trackUri, target)) {
			return { outcome: ${JSON.stringify(SpotifyAddTrackOutcome.alreadyPresent)}, trackUri };
		}
		if (target.kind === ${JSON.stringify(SpotifyPlaylistKind.likedSongs)}) {
			await resolve(${JSON.stringify(SpotifyServices.library)}).add({ uris: [trackUri] });
		} else {
			await resolve(${JSON.stringify(SpotifyServices.playlist)}).add(target.uri, [trackUri], { after: 'end' });
		}
		return { outcome: ${JSON.stringify(SpotifyAddTrackOutcome.added)}, trackUri };
	`;
}

/**
 * Builds the command that adds the playing track to the like target, unless it is already there.
 * Rejects with `SpotifyNoCurrentTrackError` when Spotify has no track loaded.
 */
export function addCurrentTrackToLikeTarget(
	target: LikeTargetRef
): SpotifyCommand {
	const body = buildBody(target);
	return async (session) => {
		parseAddTrackOutcome(await runPlatformScript(session, body));
	};
}
