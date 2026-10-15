import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

import { SpotifyPlayerBinding } from './spotify_player_binding';
import { buildPlayerWatchBody } from './build_player_watch_body';
import { buildPlatformExpression } from './build_platform_expression';

type FakeImage = Readonly<{ url: string; label: string }>;
type FakeTrack = Readonly<{
	uri: string;
	name: string;
	artists?: readonly Readonly<{ name: string }>[];
	images?: readonly FakeImage[];
	album?: Readonly<{ images: readonly FakeImage[] }>;
}>;
type FakePlayerState = Readonly<{
	isPaused: boolean;
	item: FakeTrack | null;
	duration?: number;
	positionAsOfTimestamp?: number;
	timestamp?: number;
	speed?: number;
}>;

function buildFakePage(initialState: FakePlayerState) {
	let playerState = initialState;
	let listener: () => void = () => undefined;
	const removeListener = vi.fn();
	const addListener = vi.fn((_event: string, callback: () => void) => {
		listener = callback;
		return removeListener;
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
		Date,
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
		removeListener,
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
const PLAYING: FakePlayerState = {
	isPaused: false,
	item: TRACK,
	duration: 200_000,
	positionAsOfTimestamp: 1_000,
	timestamp: 5_000,
	speed: 1,
};

function trackOf(
	overrides: Readonly<Record<string, unknown>> = {}
): Record<string, unknown> {
	return {
		title: TRACK.name,
		artistNames: [],
		imageUrl: null,
		durationMilliseconds: 200_000,
		positionMilliseconds: 1_000,
		positionTimestamp: 5_000,
		playbackSpeed: 1,
		...overrides,
	};
}

function payloadOf(
	isPaused: boolean,
	trackUri: string | null,
	track: Record<string, unknown> | null = trackOf()
): string {
	return JSON.stringify({ isPaused, trackUri, track });
}

function lastReport(page: Readonly<{ reportedPayloads: unknown[] }>): unknown {
	return JSON.parse(String(page.reportedPayloads.at(-1)));
}

describe('buildPlayerWatchBody', () => {
	it('should report the current state when injected', async () => {
		const page = buildFakePage(PLAYING);

		await page.runScript();

		expect(page.reportedPayloads).toEqual([payloadOf(false, TRACK.uri)]);
	});

	it('should report a null track when no track is loaded', async () => {
		const page = buildFakePage({ isPaused: true, item: null });

		await page.runScript();

		expect(page.reportedPayloads).toEqual([payloadOf(true, null, null)]);
	});

	it('should report the title, the artists and the playback speed of the track', async () => {
		const page = buildFakePage({
			...PLAYING,
			item: { ...TRACK, artists: [{ name: 'X' }, { name: 'Y' }] },
			speed: 1.5,
		});

		await page.runScript();

		expect(lastReport(page)).toEqual(
			JSON.parse(
				payloadOf(
					false,
					TRACK.uri,
					trackOf({ artistNames: ['X', 'Y'], playbackSpeed: 1.5 })
				)
			)
		);
	});

	it('should prefer the small image of the track', async () => {
		const page = buildFakePage({
			...PLAYING,
			item: {
				...TRACK,
				images: [
					{ url: 'spotify:image:large', label: 'large' },
					{ url: 'spotify:image:small', label: 'small' },
				],
			},
		});

		await page.runScript();

		expect(lastReport(page)).toMatchObject({
			track: { imageUrl: 'spotify:image:small' },
		});
	});

	it('should fall back on the album images', async () => {
		const page = buildFakePage({
			...PLAYING,
			item: {
				...TRACK,
				album: { images: [{ url: 'spotify:image:album', label: 'xlarge' }] },
			},
		});

		await page.runScript();

		expect(lastReport(page)).toMatchObject({
			track: { imageUrl: 'spotify:image:album' },
		});
	});

	it('should subscribe to the update event', async () => {
		const page = buildFakePage(PLAYING);

		await page.runScript();

		expect(page.addListener).toHaveBeenCalledWith(
			'update',
			expect.any(Function)
		);
	});

	it('should report again when an update changes the state', async () => {
		const page = buildFakePage(PLAYING);
		await page.runScript();

		await page.changeState({ ...PLAYING, isPaused: true });

		expect(page.reportedPayloads).toEqual([
			payloadOf(false, TRACK.uri),
			payloadOf(true, TRACK.uri),
		]);
	});

	it('should report again when the playback position jumps', async () => {
		const page = buildFakePage(PLAYING);
		await page.runScript();

		await page.changeState({
			...PLAYING,
			positionAsOfTimestamp: 90_000,
			timestamp: 9_000,
		});

		expect(page.reportedPayloads).toHaveLength(2);
	});

	it('should not report again when an update leaves the state unchanged', async () => {
		const page = buildFakePage(PLAYING);
		await page.runScript();

		await page.changeState({ ...PLAYING, item: { ...TRACK } });

		expect(page.reportedPayloads).toEqual([payloadOf(false, TRACK.uri)]);
	});

	it('should replace its listener when injected twice', async () => {
		const page = buildFakePage(PLAYING);

		await page.runScript();
		await page.runScript();

		expect(page.addListener).toHaveBeenCalledTimes(2);
		expect(page.removeListener).toHaveBeenCalledTimes(1);
	});

	it('should re-send the current state when injected twice', async () => {
		const page = buildFakePage(PLAYING);

		await page.runScript();
		await page.runScript();

		expect(page.reportedPayloads).toEqual([
			payloadOf(false, TRACK.uri),
			payloadOf(false, TRACK.uri),
		]);
	});
});
