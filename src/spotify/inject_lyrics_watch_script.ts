import { evaluateInSpotify } from './evaluate_in_spotify';
import type { CdpConnection } from '../cdp/cdp_connection';
import { parseEvaluateResult } from './parse_evaluate_result';
import { buildLyricsWatchScript } from './build_lyrics_watch_script';

/** Injects the idempotent lyrics watch script, into one execution context or the page's default one. */
export async function injectLyricsWatchScript(
	page: CdpConnection,
	contextId?: number
): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page,
		expression: buildLyricsWatchScript(),
		...(contextId === undefined ? {} : { contextId }),
	});
	parseEvaluateResult(rawResult);
}
