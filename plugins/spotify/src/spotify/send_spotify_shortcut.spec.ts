import { describe, expect, it, vi } from 'vitest';

import { sendSpotifyShortcut } from './send_spotify_shortcut';
import type { SpotifySession } from './spotify_session';
import { SpotifyShortcuts } from './spotify_shortcuts';

const CONTROL_MODIFIERS = 2;
const KEY_K_CODE = 75;

function buildSession() {
	const send = vi.fn(() => Promise.resolve({}));
	const connection = { send, close: vi.fn() };
	const session: SpotifySession = {
		browser: connection,
		page: connection,
		pageTargetId: 'target-1',
		launchedByPlugin: false,
	};
	return { session, send };
}

function buildExpectedKeyEvent(type: string): unknown {
	return {
		type,
		modifiers: CONTROL_MODIFIERS,
		key: 'k',
		code: 'KeyK',
		windowsVirtualKeyCode: KEY_K_CODE,
		nativeVirtualKeyCode: KEY_K_CODE,
	};
}

describe('sendSpotifyShortcut', () => {
	it('should press Ctrl+K first', async () => {
		const { session, send } = buildSession();

		await sendSpotifyShortcut(session, SpotifyShortcuts.openSearch);

		expect(send).toHaveBeenNthCalledWith(
			1,
			'Input.dispatchKeyEvent',
			buildExpectedKeyEvent('rawKeyDown')
		);
	});

	it('should release Ctrl+K second', async () => {
		const { session, send } = buildSession();

		await sendSpotifyShortcut(session, SpotifyShortcuts.openSearch);

		expect(send).toHaveBeenNthCalledWith(
			2,
			'Input.dispatchKeyEvent',
			buildExpectedKeyEvent('keyUp')
		);
	});
});
