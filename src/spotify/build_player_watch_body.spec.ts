import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

import { SpotifyPlayerBinding } from './spotify_player_binding';
import { buildPlayerWatchBody } from './build_player_watch_body';
import { buildPlatformExpression } from './build_platform_expression';

type FakeTrack = Readonly<{ uri: string; name: string }>;
type FakePlayerState = Readonly<{
	isPaused: boolean;
	item: FakeTrack | null;
}>;

function buildFakePage(initialState: FakePlayerState) {
	let playerState = initialState;
	let listener: () => void = () => undefined;
	const addListener = vi.fn((_event: string, callback: () => void) => {
		listener = callback;
		return () => undefined;
	});
	const player = {
		getState: () => playerState,
		getEvents: () => ({ addListener }),
	};
	const registryMap = new Map<symbol, unknown>([[Symbol('PlayerAPI'), player]]);
	const registry = {
		_map: registryMap,
		resolve: (key: symbol): unknown => registryMap.get(key),
	};
	const platform = { getRegistry: () => registry };
	const reportedPayloads: unknown[] = [];
	const context = vm.createContext({
		window: {
			[SpotifyPlayerBinding.name]: (payload: unknown) =>
				reportedPayloads.push(payload),
		},
		document: {
			getElementById: () => ({
				__reactContainerFake: { memoizedProps: { platform } },
			}),
		},
	});
	return {
		reportedPayloads,
		addListener,
		runScript: (): Promise<unknown> =>
			vm.runInContext(buildPlatformExpression(buildPlayerWatchBody()), context),
		changeState: async (nextState: FakePlayerState): Promise<void> => {
			playerState = nextState;
			listener();
			await Promise.resolve();
		},
	};
}

const TRACK: FakeTrack = { uri: 'spotify:track:a', name: 'A' };

function payloadOf(isPaused: boolean, trackUri: string | null): string {
	return JSON.stringify({ isPaused, trackUri });
}

describe('buildPlayerWatchBody', () => {
	it('should report the current state when injected', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });

		await page.runScript();

		expect(page.reportedPayloads).toEqual([payloadOf(false, TRACK.uri)]);
	});

	it('should report a null track uri when no track is loaded', async () => {
		const page = buildFakePage({ isPaused: true, item: null });

		await page.runScript();

		expect(page.reportedPayloads).toEqual([payloadOf(true, null)]);
	});

	it('should subscribe to the update event', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });

		await page.runScript();

		expect(page.addListener).toHaveBeenCalledWith(
			'update',
			expect.any(Function)
		);
	});

	it('should report again when an update changes the state', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });
		await page.runScript();

		await page.changeState({ isPaused: true, item: TRACK });

		expect(page.reportedPayloads).toEqual([
			payloadOf(false, TRACK.uri),
			payloadOf(true, TRACK.uri),
		]);
	});

	it('should not report again when an update leaves the state unchanged', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });
		await page.runScript();

		await page.changeState({ isPaused: false, item: { ...TRACK } });

		expect(page.reportedPayloads).toEqual([payloadOf(false, TRACK.uri)]);
	});

	it('should subscribe only once when injected twice', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });

		await page.runScript();
		await page.runScript();

		expect(page.addListener).toHaveBeenCalledTimes(1);
	});

	it('should re-send the current state when injected twice', async () => {
		const page = buildFakePage({ isPaused: false, item: TRACK });

		await page.runScript();
		await page.runScript();

		expect(page.reportedPayloads).toEqual([
			payloadOf(false, TRACK.uri),
			payloadOf(false, TRACK.uri),
		]);
	});
});
