import { evaluateInSpotify } from './evaluate_in_spotify';
import type { CdpConnection } from '../cdp/cdp_connection';
import { parsePlatformOutcome } from './parse_platform_outcome';
import { buildPlayerWatchBody } from './build_player_watch_body';
import { buildPlatformExpression } from './build_platform_expression';

/**
 * Injects the idempotent player watch script, into one execution context or the page's default one.
 * Rejects with a platform-not-found error while Spotify's UI has not finished loading.
 */
export async function injectPlayerWatchScript(
	page: CdpConnection,
	contextId?: number
): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page,
		expression: buildPlatformExpression(buildPlayerWatchBody()),
		...(contextId === undefined ? {} : { contextId }),
	});
	parsePlatformOutcome(rawResult);
}
