import { SpotifyClickOutcome } from './spotify_click_outcome';

/** Builds the JavaScript expression that clicks the element with the given `data-testid`. */
export function buildClickExpression(testId: string): string {
	const selector = JSON.stringify(`[data-testid="${testId}"]`);
	return `(() => {
		const element = document.querySelector(${selector});
		if (!element) { return ${JSON.stringify(SpotifyClickOutcome.notFound)}; }
		element.click();
		return ${JSON.stringify(SpotifyClickOutcome.clicked)};
	})()`;
}
