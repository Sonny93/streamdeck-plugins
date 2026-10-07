import { beforeEach, describe, expect, it, vi } from 'vitest';

import { waitForSpotifyExit } from './wait_for_spotify_exit';
import { ensureSpotifyRunning } from './ensure_spotify_running';
import { killProcessImage } from '../windows/kill_process_image';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import { isProcessImageRunning } from '../windows/is_process_image_running';
import { ensureSpotifyDebugPortOnStartup } from './ensure_spotify_debug_port_on_startup';

vi.mock('./wait_for_spotify_exit');
vi.mock('./ensure_spotify_running');
vi.mock('./fetch_browser_web_socket_url');
vi.mock('../windows/kill_process_image');
vi.mock('../windows/is_process_image_running');

const SPOTIFY_IMAGE_NAME = 'Spotify.exe';
const WEB_SOCKET_URL = 'ws://127.0.0.1:9229/devtools/browser/abc';

function closePort(): void {
	vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(
		new SpotifyNotReachableError()
	);
}

describe('ensureSpotifyDebugPortOnStartup', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should return already-open when the port answers', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockResolvedValue(WEB_SOCKET_URL);

		await expect(ensureSpotifyDebugPortOnStartup()).resolves.toBe(
			'already-open'
		);
	});

	it('should not kill Spotify when the port answers', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockResolvedValue(WEB_SOCKET_URL);

		await ensureSpotifyDebugPortOnStartup();

		expect(killProcessImage).not.toHaveBeenCalled();
	});

	it('should return spotify-not-running when the port is closed and no process runs', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(false);

		await expect(ensureSpotifyDebugPortOnStartup()).resolves.toBe(
			'spotify-not-running'
		);
	});

	it('should not kill Spotify when it is not running', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(false);

		await ensureSpotifyDebugPortOnStartup();

		expect(killProcessImage).not.toHaveBeenCalled();
	});

	it('should not launch Spotify when it is not running', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(false);

		await ensureSpotifyDebugPortOnStartup();

		expect(ensureSpotifyRunning).not.toHaveBeenCalled();
	});

	it('should return restarted when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(true);

		await expect(ensureSpotifyDebugPortOnStartup()).resolves.toBe('restarted');
	});

	it('should kill the Spotify image when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(true);

		await ensureSpotifyDebugPortOnStartup();

		expect(killProcessImage).toHaveBeenCalledWith(SPOTIFY_IMAGE_NAME);
	});

	it('should relaunch Spotify when the port is closed but Spotify runs', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(true);

		await ensureSpotifyDebugPortOnStartup();

		expect(ensureSpotifyRunning).toHaveBeenCalledOnce();
	});

	it('should wait for the exit before relaunching Spotify', async () => {
		closePort();
		vi.mocked(isProcessImageRunning).mockResolvedValue(true);
		const calls: string[] = [];
		vi.mocked(killProcessImage).mockImplementation(() => {
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

		await ensureSpotifyDebugPortOnStartup();

		expect(calls).toStrictEqual(['kill', 'wait', 'launch']);
	});

	it('should rethrow a non-reachability error from the port check', async () => {
		const failure = new Error('unexpected payload');
		vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(failure);

		await expect(ensureSpotifyDebugPortOnStartup()).rejects.toBe(failure);
	});

	it('should not check processes when the port check fails unexpectedly', async () => {
		vi.mocked(fetchBrowserWebSocketUrl).mockRejectedValue(new Error('boom'));

		await ensureSpotifyDebugPortOnStartup().catch(() => undefined);

		expect(isProcessImageRunning).not.toHaveBeenCalled();
	});
});
