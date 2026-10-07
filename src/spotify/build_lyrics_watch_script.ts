import { SpotifyTestIds } from './spotify_test_ids';
import { LyricsBindingPayload } from './lyrics_binding_payload';
import { SpotifyLyricsBinding } from './spotify_lyrics_binding';

/**
 * Builds the idempotent script that reports lyrics availability through the CDP binding.
 * It reports the current value immediately, then only when it changes, from a single MutationObserver.
 * Injecting it again re-sends the current value without stacking observers.
 */
export function buildLyricsWatchScript(): string {
	const selector = JSON.stringify(
		`[data-testid="${SpotifyTestIds.lyricsButton}"]`
	);
	return `(() => {
		const bindingName = ${JSON.stringify(SpotifyLyricsBinding.name)};
		const guardProperty = ${JSON.stringify(SpotifyLyricsBinding.guardProperty)};
		const state = window[guardProperty] ?? (window[guardProperty] = { lastPayload: undefined, observer: undefined });
		const computePayload = () => {
			const button = document.querySelector(${selector});
			const isUnavailable = !button || button.disabled === true || button.getAttribute('aria-disabled') === 'true';
			return isUnavailable ? ${JSON.stringify(LyricsBindingPayload.unavailable)} : ${JSON.stringify(LyricsBindingPayload.available)};
		};
		const report = (force) => {
			const payload = computePayload();
			const binding = window[bindingName];
			if (typeof binding !== 'function') { return; }
			if (!force && payload === state.lastPayload) { return; }
			state.lastPayload = payload;
			binding(payload);
		};
		if (!state.observer) {
			state.observer = new MutationObserver(() => report(false));
			state.observer.observe(document.body ?? document.documentElement, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ['disabled', 'aria-disabled'],
			});
		}
		report(true);
	})()`;
}
