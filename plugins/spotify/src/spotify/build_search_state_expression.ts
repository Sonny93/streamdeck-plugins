import { SpotifyTestIds } from './spotify_test_ids';

/** Builds the expression that reports whether the search modal input exists. */
export function buildSearchStateExpression(): string {
	const selector = JSON.stringify(
		`[data-testid="${SpotifyTestIds.searchModalInput}"]`
	);
	return `(() => ({
		hasModalInput: document.querySelector(${selector}) !== null,
	}))()`;
}
