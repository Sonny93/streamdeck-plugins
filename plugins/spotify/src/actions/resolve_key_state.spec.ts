import { describe, expect, it } from 'vitest';

import type { SpotifyUiState } from '../spotify/spotify_ui_state';
import { LyricsKeyState } from './lyrics_key_state';
import { resolveLyricsKeyState } from './resolve_lyrics_key_state';
import { resolveToggleKeyState } from './resolve_toggle_key_state';
import { ToggleKeyState } from './toggle_key_state';

const STATE: SpotifyUiState = {
	isLyricsAvailable: true,
	isLyricsOpen: false,
	isFullscreen: false,
	isSearchOpen: false,
	isFocused: false,
};

describe('resolveLyricsKeyState', () => {
	it('should show the open lyrics', () => {
		expect(resolveLyricsKeyState({ ...STATE, isLyricsOpen: true })).toBe(
			LyricsKeyState.open
		);
	});

	it('should show the closed lyrics', () => {
		expect(resolveLyricsKeyState(STATE)).toBe(LyricsKeyState.closed);
	});

	it('should grey out a track without lyrics', () => {
		expect(resolveLyricsKeyState({ ...STATE, isLyricsAvailable: false })).toBe(
			LyricsKeyState.unavailable
		);
	});

	it('should grey out the key while Spotify is unreachable', () => {
		expect(resolveLyricsKeyState(undefined)).toBe(LyricsKeyState.unavailable);
	});
});

describe('resolveToggleKeyState', () => {
	it('should light the key while what it shows is on', () => {
		expect(resolveToggleKeyState(true)).toBe(ToggleKeyState.active);
	});

	it('should show the plain key while it is off or unknown', () => {
		expect(resolveToggleKeyState(false)).toBe(ToggleKeyState.inactive);
		expect(resolveToggleKeyState(undefined)).toBe(ToggleKeyState.inactive);
	});
});
