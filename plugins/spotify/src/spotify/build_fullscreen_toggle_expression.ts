import { SpotifyFullscreenTiming } from './spotify_fullscreen_timing';
import { SpotifyFullscreenToggleOutcome } from './spotify_fullscreen_toggle_outcome';
import { SpotifyTestIds } from './spotify_test_ids';

/**
 * Builds the expression that clicks the full screen button and resolves once `fullscreenchange` fires.
 * The listener is registered before the click so the event cannot be missed. On its own timeout it
 * resolves with `timeout`, which is not an error: the caller simply continues.
 */
export function buildFullscreenToggleExpression(): string {
	const selector = JSON.stringify(
		`[data-testid="${SpotifyTestIds.fullscreenModeButton}"]`
	);
	return `(() => {
		const button = document.querySelector(${selector});
		if (!button) { return ${JSON.stringify(SpotifyFullscreenToggleOutcome.notFound)}; }
		return new Promise((resolve) => {
			const finish = (outcome) => {
				clearTimeout(timer);
				document.removeEventListener('fullscreenchange', onChange);
				resolve(outcome);
			};
			const onChange = () => finish(${JSON.stringify(SpotifyFullscreenToggleOutcome.changed)});
			const timer = setTimeout(() => finish(${JSON.stringify(SpotifyFullscreenToggleOutcome.timeout)}), ${SpotifyFullscreenTiming.changeTimeoutMilliseconds});
			document.addEventListener('fullscreenchange', onChange);
			button.click();
		});
	})()`;
}
