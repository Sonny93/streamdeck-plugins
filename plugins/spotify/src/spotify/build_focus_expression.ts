import { SpotifyFocusOutcome } from './spotify_focus_outcome';

/** Builds the JavaScript expression that focuses the element with the given `data-testid`. */
export function buildFocusExpression(testId: string): string {
	const selector = JSON.stringify(`[data-testid="${testId}"]`);
	return `(() => {
		const element = document.querySelector(${selector});
		if (!element) { return ${JSON.stringify(SpotifyFocusOutcome.notFound)}; }
		element.focus();
		return ${JSON.stringify(SpotifyFocusOutcome.focused)};
	})()`;
}
