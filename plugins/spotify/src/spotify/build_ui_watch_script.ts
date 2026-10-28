import { SpotifyTestIds } from './spotify_test_ids';
import { SpotifyUiBinding } from './spotify_ui_binding';

const OBSERVED_ATTRIBUTES = [
	'disabled',
	'aria-disabled',
	'aria-pressed',
	'data-active',
];

function selectorOf(testId: string): string {
	return JSON.stringify(`[data-testid="${testId}"]`);
}

/**
 * Builds the idempotent script that reports the state of the Spotify window through the CDP binding, as JSON:
 * lyrics available (the lyrics button exists and is enabled) and open (pressed), full screen (a full screen element or the
 * button pressed), search open (the search modal input exists) and focused (`document.hasFocus()`).
 * It reports the current state immediately, then only changes, from one MutationObserver plus the full screen and focus events.
 * Injecting it again re-sends the current state without stacking listeners.
 */
export function buildUiWatchScript(): string {
	return `(() => {
		const bindingName = ${JSON.stringify(SpotifyUiBinding.name)};
		const guardProperty = ${JSON.stringify(SpotifyUiBinding.guardProperty)};
		const state = window[guardProperty] ?? (window[guardProperty] = { lastPayload: undefined, observer: undefined });
		const isPressed = (button) => Boolean(button) && (button.getAttribute('aria-pressed') === 'true' || button.getAttribute('data-active') === 'true');
		const computePayload = () => {
			const lyricsButton = document.querySelector(${selectorOf(SpotifyTestIds.lyricsButton)});
			const fullscreenButton = document.querySelector(${selectorOf(SpotifyTestIds.fullscreenModeButton)});
			const isLyricsAvailable = Boolean(lyricsButton) && lyricsButton.disabled !== true && lyricsButton.getAttribute('aria-disabled') !== 'true';
			return JSON.stringify({
				isLyricsAvailable,
				isLyricsOpen: isLyricsAvailable && isPressed(lyricsButton),
				isFullscreen: Boolean(document.fullscreenElement) || isPressed(fullscreenButton),
				isSearchOpen: document.querySelector(${selectorOf(SpotifyTestIds.searchModalInput)}) !== null,
				isFocused: document.hasFocus(),
			});
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
			const onChange = () => report(false);
			state.observer = new MutationObserver(onChange);
			state.observer.observe(document.body ?? document.documentElement, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ${JSON.stringify(OBSERVED_ATTRIBUTES)},
			});
			document.addEventListener('fullscreenchange', onChange);
			window.addEventListener('focus', onChange);
			window.addEventListener('blur', onChange);
		}
		report(true);
	})()`;
}
