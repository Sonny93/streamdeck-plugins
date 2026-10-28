import { z } from 'zod';

import type { LikeTargetRef } from './like_target_ref';
import type { SpotifySession } from './spotify_session';
import { runPlatformScript } from './run_platform_script';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { buildTrackPresenceSnippet } from './build_track_presence_snippet';

const presenceSchema = z.boolean();

function buildBody(
	options: Readonly<{ trackUri: string; target: LikeTargetRef }>
): string {
	return `
		${buildTrackPresenceSnippet()}
		return await isTrackInTarget(${JSON.stringify(options.trackUri)}, ${JSON.stringify({ uri: options.target.uri, kind: options.target.kind })});
	`;
}

/**
 * Builds the read-only query that tells whether the track is already in the like target:
 * Liked Songs when the target kind says so, otherwise the playlist with the target URI.
 */
export function isTrackInLikeTarget(
	options: Readonly<{ trackUri: string; target: LikeTargetRef }>
): (session: SpotifySession) => Promise<boolean> {
	return async (session) => {
		const parsed = presenceSchema.safeParse(
			await runPlatformScript(session, buildBody(options))
		);
		if (!parsed.success) {
			throw new SpotifyEvaluationError({
				reason: 'the track presence query returned an unexpected value',
				cause: parsed.error,
			});
		}
		return parsed.data;
	};
}
