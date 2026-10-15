import { describe, expect, it, vi } from 'vitest';

import { NowPlayingScreen } from './now_playing_screen';
import { NowPlayingTiming } from './now_playing_timing';
import type { CarouselScheduler } from './carousel_scheduler';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';

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
	options: Readonly<{ fetchCover?: (url: string) => Promise<string> }> = {}
) {
	let state: SpotifyPlayerState | undefined = PLAYING;
	let inactive = false;
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
		schedule,
		now: () => 83_000,
		onError,
	});
	const dial = buildDial('dial-0', 0);
	return {
		screen,
		dial,
		ticks,
		onError,
		fetchCover,
		setInactive,
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
});
