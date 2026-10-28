import type { CdpConnection } from '../cdp/cdp_connection';
import { buildUiWatchScript } from './build_ui_watch_script';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { parseEvaluateResult } from './parse_evaluate_result';

/** Injects the idempotent window state watch script, into one execution context or the page's default one. */
export async function injectUiWatchScript(
	page: CdpConnection,
	contextId?: number
): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page,
		expression: buildUiWatchScript(),
		...(contextId === undefined ? {} : { contextId }),
	});
	parseEvaluateResult(rawResult);
}
