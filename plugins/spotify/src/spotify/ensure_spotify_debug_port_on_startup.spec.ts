import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildFakeSpotifyHost } from '../platform/build_fake_spotify_host';
import { ensureSpotifyDebugPortOnStartup } from './ensure_spotify_debug_port_on_startup';
import { ensureSpotifyRunning } from './ensure_spotify_running';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';
import { waitForSpotifyExit } from './wait_for_spotify_exit';

vi.mock('./wait_for_spotify_exit');
vi.mock('./ensure_spotify_running');
vi.mock('./fetch_browser_web_socket_url');

const WEB_SOCKET_URL = 'ws://127.0.0.1:9229/devtools/browser/abc';

function closePort(): void {
	vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(
		new SpotifyNotReachableError()
	);
}

describe('ensureSpotifyDebugPortOnStartup', () => {
	let host = buildFakeSpotifyHost();

	beforeEach(() => {
		vi.resetAllMocks();
		host = buildFakeSpotifyHost();
	});

	it('should return already-open when the port answers', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockResolvedValue(WEB_SOCKET_URL);

		await expect(ensureSpotifyDebugPortOnStartup(host)).resolves.toBe(
			'already-open'
		);
	});

	it('should not kill Spotify when the port answers', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockResolvedValue(WEB_SOCKET_URL);

		await ensureSpotifyDebugPortOnStartup(host);

		expect(host.killSpotify).not.toHaveBeenCalled();
	});

	it('should return spotify-not-running when the port is closed and no process runs', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(false);

		await expect(ensureSpotifyDebugPortOnStartup(host)).resolves.toBe(
			'spotify-not-running'
		);
	});

	it('should not kill Spotify when it is not running', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(false);

		await ensureSpotifyDebugPortOnStartup(host);

		expect(host.killSpotify).not.toHaveBeenCalled();
	});

	it('should not launch Spotify when it is not running', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(false);

		await ensureSpotifyDebugPortOnStartup(host);

		expect(ensureSpotifyRunning).not.toHaveBeenCalled();
	});

	it('should return restarted when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(true);

		await expect(ensureSpotifyDebugPortOnStartup(host)).resolves.toBe(
			'restarted'
		);
	});

	it('should kill Spotify when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(true);

		await ensureSpotifyDebugPortOnStartup(host);

		expect(host.killSpotify).toHaveBeenCalledOnce();
	});

	it('should relaunch Spotify when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(true);

		await ensureSpotifyDebugPortOnStartup(host);

		expect(ensureSpotifyRunning).toHaveBeenCalledOnce();
	});

	it('should wait for the exit before relaunching Spotify', async () => {
		closePort();
		vi.mocked(host.isSpotifyRunning).mockResolvedValue(true);
		const calls: string[] = [];
		vi.mocked(host.killSpotify).mockImplementation(() => {
			calls.push('kill');
			return Promise.resolve();
		});
		vi.mocked(waitForSpotifyExit).mockImplementation(() => {
			calls.push('wait');
			return Promise.resolve();
		});
		vi.mocked(ensureSpotifyRunning).mockImplementation(() => {
			calls.push('launch');
			return Promise.resolve({
				browserWebSocketUrl: WEB_SOCKET_URL,
				launchedByPlugin: true,
			});
		});

		await ensureSpotifyDebugPortOnStartup(host);

		expect(calls).toStrictEqual(['kill', 'wait', 'launch']);
	});

	it('should rethrow a non-reachability error from the port check', async () => {
		const failure = new Error('unexpected payload');
		vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(failure);

		await expect(ensureSpotifyDebugPortOnStartup(host)).rejects.toBe(failure);
	});

	it('should not check processes when the port check fails unexpectedly', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(new Error('boom'));

		await ensureSpotifyDebugPortOnStartup(host).catch(() => undefined);

		expect(host.isSpotifyRunning).not.toHaveBeenCalled();
	});
});
