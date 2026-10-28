import { describe, expect, it, vi } from 'vitest';

import type { SpotifyLyricsLine } from '../spotify/spotify_lyrics_line';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';
import type { CarouselScheduler } from './carousel_scheduler';
import { NowPlayingScreen } from './now_playing_screen';
import { NowPlayingTiming } from './now_playing_timing';

const COVER_URL = 'https://i.scdn.co/image/a';
const COVER_DATA_URL = 'data:image/jpeg;base64,AQID';
const PLAYING: SpotifyPlayerState = {
	isPaused: false,
	trackUri: 'spotify:track:a',
	track: {
		title: 'Kosandra',
		artistNames: ['Miyagi'],
		imageUrl: COVER_URL,
		durationMilliseconds: 200_000,
		positionMilliseconds: 0,
		positionTimestamp: 0,
		playbackSpeed: 1,
	},
};
const PAUSED: SpotifyPlayerState = { ...PLAYING, isPaused: true };
const NOTHING_LOADED: SpotifyPlayerState = {
	isPaused: true,
	trackUri: undefined,
	track: undefined,
};

type FeedbackMock = ReturnType<
	typeof vi.fn<(feedback: Readonly<Record<string, string>>) => Promise<void>>
>;

function decodeLast(setFeedback: FeedbackMock): string {
	const dataUrl = setFeedback.mock.calls.at(-1)?.[0].canvas ?? '';
	return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64').toString('utf8');
}

function buildDial(id: string, column: number) {
	const setFeedback: FeedbackMock = vi.fn(() => Promise.resolve());
	return { id, column, setFeedback };
}

function buildScreen(
	options: Readonly<{
		fetchCover?: (url: string) => Promise<string>;
		fetchLyrics?: (trackUri: string) => Promise<readonly SpotifyLyricsLine[]>;
	}> = {}
) {
	let state: SpotifyPlayerState | undefined = PLAYING;
	let inactive = false;
	let now = 83_000;
	const playerListeners = new Set<() => void>();
	const inactivityListeners = new Set<() => void>();
	const ticks: { callback: () => void; delay: number; cancelled: boolean }[] =
		[];
	const schedule: CarouselScheduler = (callback, delay) => {
		const tick = { callback, delay, cancelled: false };
		ticks.push(tick);
		return () => {
			tick.cancelled = true;
		};
	};
	const onError = vi.fn();
	const fetchCover = vi.fn(
		options.fetchCover ?? (() => Promise.resolve(COVER_DATA_URL))
	);
	const fetchLyrics = vi.fn(options.fetchLyrics ?? (() => Promise.resolve([])));
	const setInactive = (value: boolean): void => {
		inactive = value;
		for (const listener of inactivityListeners) {
			listener();
		}
	};
	const screen = new NowPlayingScreen({
		inactivity: {
			get isInactive() {
				return inactive;
			},
			subscribe: (listener) => {
				const wrapped = (): void => listener(inactive);
				inactivityListeners.add(wrapped);
				return () => inactivityListeners.delete(wrapped);
			},
			recordActivity: () => {
				const wasInactive = inactive;
				if (wasInactive) {
					setInactive(false);
				}
				return wasInactive;
			},
		},
		playerStateHub: {
			get current() {
				return state;
			},
			subscribe: (listener) => {
				const wrapped = (): void => listener(state);
				playerListeners.add(wrapped);
				wrapped();
				return () => playerListeners.delete(wrapped);
			},
		},
		fetchCover,
		fetchLyrics,
		schedule,
		now: () => now,
		onError,
	});
	const dial = buildDial('dial-0', 0);
	return {
		screen,
		dial,
		ticks,
		onError,
		fetchCover,
		fetchLyrics,
		setInactive,
		setNow: (value: number): void => {
			now = value;
		},
		setState: (next: SpotifyPlayerState | undefined): void => {
			state = next;
			for (const listener of playerListeners) {
				listener();
			}
		},
		lastSvg: (): string => decodeLast(dial.setFeedback),
		flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
	};
}

describe('NowPlayingScreen', () => {
	it('should not show while the Stream Deck is active', () => {
		const { screen, dial } = buildScreen();

		screen.attach(dial);

		expect(screen.isShowing).toBe(false);
		expect(dial.setFeedback).not.toHaveBeenCalled();
	});

	it('should draw the playing track once the Stream Deck is inactive', async () => {
		const { screen, dial, setInactive, lastSvg, flush } = buildScreen();
		screen.attach(dial);

		setInactive(true);
		await flush();

		expect(screen.isShowing).toBe(true);
		expect(lastSvg()).toContain('>Kosandra</text>');
		expect(lastSvg()).toContain('>1:23</text>');
		expect(lastSvg()).toContain('>3:20</text>');
	});

	it('should draw on each dial the slice of its column', async () => {
		const { screen, dial, setInactive, flush } = buildScreen();
		const thirdDial = buildDial('dial-2', 2);
		screen.attach(dial);
		screen.attach(thirdDial);

		setInactive(true);
		await flush();

		expect(decodeLast(thirdDial.setFeedback)).toContain(
			'viewBox="400 0 200 100"'
		);
	});

	it('should draw at once on a dial attached while showing', async () => {
		const { screen, dial, setInactive, flush } = buildScreen();
		const lateDial = buildDial('dial-1', 1);
		screen.attach(dial);
		setInactive(true);

		screen.attach(lateDial);
		await flush();

		expect(lateDial.setFeedback).toHaveBeenCalled();
	});

	it('should not show when no track is loaded', () => {
		const { screen, dial, setInactive, setState } = buildScreen();
		screen.attach(dial);
		setState(NOTHING_LOADED);

		setInactive(true);

		expect(screen.isShowing).toBe(false);
	});

	it('should download the cover as soon as the track is known', () => {
		const { screen, dial, fetchCover } = buildScreen();

		screen.attach(dial);

		expect(fetchCover).toHaveBeenCalledWith(COVER_URL);
	});

	it('should draw the cover once it is downloaded', async () => {
		const { screen, dial, setInactive, lastSvg, flush } = buildScreen();
		screen.attach(dial);
		await flush();

		setInactive(true);
		await flush();

		expect(lastSvg()).toContain(COVER_DATA_URL);
	});

	it('should not download the same cover twice', async () => {
		const { screen, dial, setInactive, setState, fetchCover, flush } =
			buildScreen();
		screen.attach(dial);
		await flush();

		setInactive(true);
		setState(PAUSED);
		await flush();

		expect(fetchCover).toHaveBeenCalledTimes(1);
	});

	it('should report a cover that cannot be downloaded and draw without it', async () => {
		const error = new Error('offline');
		const { screen, dial, setInactive, onError, lastSvg, flush } = buildScreen({
			fetchCover: () => Promise.reject(error),
		});
		screen.attach(dial);
		await flush();

		setInactive(true);
		await flush();

		expect(onError).toHaveBeenCalledWith(error);
		expect(lastSvg()).not.toContain('<image');
	});

	it('should redraw the progress every second while playing', () => {
		const { screen, dial, setInactive, ticks } = buildScreen();
		screen.attach(dial);

		setInactive(true);

		expect(ticks.map((tick) => tick.delay)).toEqual([
			NowPlayingTiming.progressIntervalMilliseconds,
		]);
	});

	it('should keep redrawing after each tick', async () => {
		const { screen, dial, setInactive, ticks, flush } = buildScreen();
		screen.attach(dial);
		setInactive(true);
		await flush();
		const callsBefore = dial.setFeedback.mock.calls.length;

		ticks[0]?.callback();
		await flush();

		expect(dial.setFeedback.mock.calls.length).toBe(callsBefore + 1);
		expect(ticks).toHaveLength(2);
	});

	it('should not tick while paused', () => {
		const { screen, dial, setInactive, setState, ticks } = buildScreen();
		screen.attach(dial);
		setState(PAUSED);

		setInactive(true);

		expect(ticks).toHaveLength(0);
	});

	it('should redraw when the player changes', async () => {
		const { screen, dial, setInactive, setState, lastSvg, flush } =
			buildScreen();
		screen.attach(dial);
		setInactive(true);

		setState(PAUSED);
		await flush();

		expect(lastSvg()).toContain('<circle');
	});

	it('should hide and tell when a track is no longer loaded', () => {
		const { screen, dial, setInactive, setState } = buildScreen();
		const onHidden = vi.fn();
		screen.onHidden(onHidden);
		screen.attach(dial);
		setInactive(true);

		setState(undefined);

		expect(screen.isShowing).toBe(false);
		expect(onHidden).toHaveBeenCalledTimes(1);
	});

	it('should hide, stop ticking and report that it was showing when woken', () => {
		const { screen, dial, setInactive, ticks } = buildScreen();
		const onHidden = vi.fn();
		screen.onHidden(onHidden);
		screen.attach(dial);
		setInactive(true);

		expect(screen.wake()).toBe(true);
		expect(screen.isShowing).toBe(false);
		expect(onHidden).toHaveBeenCalledTimes(1);
		expect(ticks[0]?.cancelled).toBe(true);
	});

	it('should report that it was not showing when woken while hidden', () => {
		const { screen, dial } = buildScreen();
		screen.attach(dial);

		expect(screen.wake()).toBe(false);
	});

	it('should not tell it hid when it was not showing', () => {
		const { screen, dial, setState } = buildScreen();
		const onHidden = vi.fn();
		screen.onHidden(onHidden);
		screen.attach(dial);

		setState(NOTHING_LOADED);

		expect(onHidden).not.toHaveBeenCalled();
	});

	it('should stop once the last dial is detached', () => {
		const { screen, dial, setInactive } = buildScreen();
		screen.attach(dial);

		screen.detach(dial.id);
		setInactive(true);

		expect(screen.isShowing).toBe(false);
		expect(dial.setFeedback).not.toHaveBeenCalled();
	});

	describe('backdrop for the dials', () => {
		it('should offer the cover once downloaded and tell the dials', async () => {
			const { screen, dial, flush } = buildScreen();
			const onBackdropChanged = vi.fn();
			screen.onBackdropChanged(onBackdropChanged);

			screen.attach(dial);
			await flush();

			expect(screen.backdropCover).toBe(COVER_DATA_URL);
			expect(onBackdropChanged).toHaveBeenCalledTimes(1);
		});

		it('should keep the previous cover until the next one is downloaded', async () => {
			let resolveNext: (dataUrl: string) => void = () => undefined;
			const { screen, dial, setState, fetchCover, flush } = buildScreen();
			screen.attach(dial);
			await flush();
			fetchCover.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveNext = resolve;
					})
			);

			setState({
				...PLAYING,
				track: PLAYING.track && {
					...PLAYING.track,
					imageUrl: 'https://i.scdn.co/image/b',
				},
			});
			const whileLoading = screen.backdropCover;
			resolveNext('data:image/jpeg;base64,BBBB');
			await flush();

			expect(whileLoading).toBe(COVER_DATA_URL);
			expect(screen.backdropCover).toBe('data:image/jpeg;base64,BBBB');
		});

		it('should drop the cover when no track is loaded', async () => {
			const { screen, dial, setState, flush } = buildScreen();
			screen.attach(dial);
			await flush();

			setState(NOTHING_LOADED);

			expect(screen.backdropCover).toBeUndefined();
		});
	});

	describe('with lyrics', () => {
		const LINES: readonly SpotifyLyricsLine[] = [
			{ startMilliseconds: 80_000, words: 'Hola' },
			{ startMilliseconds: 85_000, words: 'Adiós' },
		];

		function buildLyricsScreen() {
			return buildScreen({ fetchLyrics: () => Promise.resolve(LINES) });
		}

		it('should fetch the lyrics as soon as the track is known', () => {
			const { screen, dial, fetchLyrics } = buildLyricsScreen();

			screen.attach(dial);

			expect(fetchLyrics).toHaveBeenCalledWith('spotify:track:a');
		});

		it('should not fetch the lyrics of the same track twice', async () => {
			const { screen, dial, setInactive, setState, fetchLyrics, flush } =
				buildLyricsScreen();
			screen.attach(dial);
			await flush();

			setInactive(true);
			setState(PAUSED);
			await flush();

			expect(fetchLyrics).toHaveBeenCalledTimes(1);
		});

		it('should draw the line being sung and the next one', async () => {
			const { screen, dial, setInactive, lastSvg, flush } = buildLyricsScreen();
			screen.attach(dial);
			await flush();

			setInactive(true);
			await flush();

			expect(lastSvg()).toContain('>Hola</text>');
			expect(lastSvg()).toContain('>Adiós</text>');
		});

		it('should redraw when the next line starts', async () => {
			const { screen, dial, setInactive, ticks, flush } = buildLyricsScreen();
			screen.attach(dial);
			await flush();
			setInactive(true);
			await flush();
			const lineChange = ticks.find(
				(tick) => tick.delay === 2_000 && !tick.cancelled
			);
			const callsBefore = dial.setFeedback.mock.calls.length;

			lineChange?.callback();
			await flush();

			expect(lineChange).toBeDefined();
			expect(dial.setFeedback.mock.calls.length).toBe(callsBefore + 1);
		});

		it('should not wait for a line change while paused', async () => {
			const { screen, dial, setInactive, setState, ticks, flush } =
				buildLyricsScreen();
			screen.attach(dial);
			setState(PAUSED);
			await flush();

			setInactive(true);

			expect(ticks).toHaveLength(0);
		});

		it('should stop waiting for a line change when woken', async () => {
			const { screen, dial, setInactive, ticks, flush } = buildLyricsScreen();
			screen.attach(dial);
			await flush();
			setInactive(true);

			screen.wake();

			expect(ticks.every((tick) => tick.cancelled)).toBe(true);
		});

		it('should report lyrics that cannot be fetched and draw without them', async () => {
			const error = new Error('offline');
			const { screen, dial, setInactive, onError, lastSvg, flush } =
				buildScreen({ fetchLyrics: () => Promise.reject(error) });
			screen.attach(dial);
			await flush();

			setInactive(true);
			await flush();

			expect(onError).toHaveBeenCalledWith(error);
			expect(lastSvg()).toContain('>Kosandra</text>');
			expect(lastSvg()).not.toContain('now-playing-lyrics');
		});

		it('should animate the change of line on the dials under the lyrics only', async () => {
			const { screen, dial, setInactive, setNow, ticks, flush } =
				buildLyricsScreen();
			const lyricsDial = buildDial('dial-3', 3);
			screen.attach(dial);
			screen.attach(lyricsDial);
			await flush();
			setInactive(true);
			await flush();
			setNow(85_000);
			ticks.find((tick) => tick.delay === 2_000 && !tick.cancelled)?.callback();
			await flush();
			const firstFrame = ticks.find(
				(tick) =>
					tick.delay === NowPlayingTiming.lyricsFrameIntervalMilliseconds &&
					!tick.cancelled
			);
			const dialCalls = dial.setFeedback.mock.calls.length;
			const lyricsDialCalls = lyricsDial.setFeedback.mock.calls.length;

			firstFrame?.callback();
			await flush();

			expect(firstFrame).toBeDefined();
			expect(dial.setFeedback.mock.calls.length).toBe(dialCalls);
			expect(lyricsDial.setFeedback.mock.calls.length).toBe(
				lyricsDialCalls + 1
			);
			expect(decodeLast(lyricsDial.setFeedback)).toContain('opacity=');
		});
	});
});
