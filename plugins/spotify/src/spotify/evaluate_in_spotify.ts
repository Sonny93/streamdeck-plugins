import type { CdpConnection } from '../cdp/cdp_connection';

type EvaluateOptions = Readonly<{
	page: CdpConnection;
	expression: string;
	contextId?: number;
}>;

/**
 * Evaluates JavaScript inside the Spotify UI page and returns the raw `Runtime.evaluate` result.
 * `userGesture` is required for actions such as full screen, and promises are awaited.
 */
export function evaluateInSpotify(options: EvaluateOptions): Promise<unknown> {
	return options.page.send('Runtime.evaluate', {
		expression: options.expression,
		returnByValue: true,
		awaitPromise: true,
		userGesture: true,
		...(options.contextId === undefined
			? {}
			: { contextId: options.contextId }),
	});
}
