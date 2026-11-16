import { describe, expect, it, vi } from 'vitest';

import { createFakeScheduler } from '../async/create_fake_scheduler';
import { InactivityMonitor } from '../async/inactivity_monitor';
import { IdlePanel } from './idle_panel';
import { IdleTiming } from './idle_timing';

const DELAY = 5000;

function createPanel(
	overrides: Readonly<{
		encodeSlice?: (svg: string) => Promise<string | undefined>;
		feedbackKey?: string;
		attachDial?: boolean;
	}> = {}
) {
	const { attachDial = true, ...panelOverrides } = overrides;
	const scheduler = createFakeScheduler();
	const inactivity = new InactivityMonitor({
		delayMilliseconds: DELAY,
		schedule: scheduler.schedule,
	});
	const state = { isAvailable: true, content: 'first' };
	const contentListeners = new Set<() => void>();
	const onError = vi.fn();
	const panel = new IdlePanel({
		inactivity,
		schedule: scheduler.schedule,
		isAvailable: () => state.isAvailable,
		subscribe: (listener) => {
			contentListeners.add(listener);
			return () => {
				contentListeners.delete(listener);
			};
		},
		buildSlice: (column) => `${state.content}:${column}`,
		onError,
		...panelOverrides,
	});
	const setFeedback = vi.fn((_feedback: Readonly<Record<string, string>>) =>
		Promise.resolve()
	);
	if (attachDial) {
		panel.attach({ id: 'first', column: 0, setFeedback });
	}
	async function elapse(): Promise<void> {
		await scheduler.advance(DELAY);
	}
	async function changeContent(
		content: string,
		isAvailable = true
	): Promise<void> {
		state.content = content;
		state.isAvailable = isAvailable;
		for (const listener of contentListeners) {
			listener();
		}
		await scheduler.settle();
	}
	return {
		panel,
		setFeedback,
		elapse,
		scheduler,
		changeContent,
		contentListeners,
		onError,
	};
}

describe('IdlePanel', () => {
	it('should not show before the inactivity delay', () => {
		const { panel, setFeedback } = createPanel();

		expect(panel.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should draw the slice of the dial as a data URL once inactive and available', async () => {
		const { panel, setFeedback, elapse } = createPanel();

		await elapse();

		expect(panel.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(1);
		const [feedback] = setFeedback.mock.calls[0] ?? [];
		expect(Object.keys(feedback ?? {})).toEqual(['canvas']);
		expect(feedback?.['canvas']).toMatch(/^data:image\/svg\+xml;base64,/u);
	});

	it('should send what the encoder returns under the feedback key it is given', async () => {
		const { setFeedback, elapse } = createPanel({
			encodeSlice: (svg) => Promise.resolve(`encoded:${svg}`),
			feedbackKey: 'picture',
		});

		await elapse();

		expect(setFeedback).toHaveBeenCalledWith({ picture: 'encoded:first:0' });
	});

	it('should send nothing when the encoder gives no image, and try again on the next change', async () => {
		let hasImage = false;
		const { setFeedback, elapse, changeContent } = createPanel({
			encodeSlice: (svg) => Promise.resolve(hasImage ? svg : undefined),
		});
		await elapse();
		hasImage = true;

		await changeContent('first');

		expect(setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should never show while the content is not available', async () => {
		const { panel, setFeedback, elapse, changeContent } = createPanel();
		await changeContent('first', false);

		await elapse();

		expect(panel.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should show when the content becomes available while inactive', async () => {
		const { panel, setFeedback, elapse, changeContent } = createPanel();
		await changeContent('first', false);
		await elapse();

		await changeContent('first', true);

		expect(panel.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should hide and tell the listeners when the content stops being available', async () => {
		const { panel, elapse, changeContent } = createPanel();
		const onHidden = vi.fn();
		panel.onHidden(onHidden);
		await elapse();

		await changeContent('first', false);

		expect(panel.isShowing).toBe(false);
		expect(onHidden).toHaveBeenCalledTimes(1);
	});

	it('should tell the listeners once when it takes the strip over', async () => {
		const { panel, elapse, changeContent } = createPanel();
		const onShown = vi.fn();
		panel.onShown(onShown);

		await elapse();
		await changeContent('second');

		expect(onShown).toHaveBeenCalledTimes(1);
	});

	it('should swallow an event that wakes the panel, and the panel hides', async () => {
		const { panel, elapse } = createPanel();
		await elapse();

		expect(panel.wake()).toBe(true);
		expect(panel.isShowing).toBe(false);
	});

	it('should swallow every event of a gesture that goes on, however long it lasts', async () => {
		const { panel, scheduler, elapse } = createPanel();
		await elapse();
		const results = [panel.wake()];

		for (let tick = 0; tick < 20; tick += 1) {
			await scheduler.advance(IdleTiming.wakeQuietMilliseconds - 1);
			results.push(panel.wake());
		}

		expect(results.every(Boolean)).toBe(true);
	});

	it('should let an event act once the dials were left alone for the quiet period', async () => {
		const { panel, scheduler, elapse } = createPanel();
		await elapse();
		panel.wake();

		await scheduler.advance(IdleTiming.wakeQuietMilliseconds);

		expect(panel.wake()).toBe(false);
	});

	it('should swallow the push up of a swallowed push down even after the quiet period', async () => {
		const { panel, scheduler, elapse } = createPanel();
		await elapse();
		const down = panel.wake('press');

		await scheduler.advance(IdleTiming.wakeQuietMilliseconds * 5);

		expect([down, panel.wake('release')]).toEqual([true, true]);
	});

	it('should draw the own content of a dial that appears long after the last activity, and show only after the full delay', async () => {
		const { panel, setFeedback, scheduler } = createPanel({
			attachDial: false,
		});
		await scheduler.advance(DELAY * 4);

		panel.attach({ id: 'late', column: 0, setFeedback });
		await scheduler.advance(DELAY - 1);
		const isShowingBeforeDelay = panel.isShowing;
		await scheduler.advance(1);

		expect(isShowingBeforeDelay).toBe(false);
		expect(panel.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should restart the delay each time the page comes back with its first dial', async () => {
		const { panel, setFeedback, scheduler } = createPanel({
			attachDial: false,
		});
		panel.attach({ id: 'page', column: 0, setFeedback });
		await scheduler.advance(DELAY - 1);
		panel.detach('page');

		panel.attach({ id: 'page', column: 0, setFeedback });
		await scheduler.advance(DELAY - 1);

		expect(panel.isShowing).toBe(false);
	});

	it('should not report a wake while it is not showing', () => {
		expect(createPanel().panel.wake()).toBe(false);
	});

	it('should show again after another delay and send the slice again', async () => {
		const { panel, setFeedback, elapse } = createPanel();
		await elapse();
		panel.wake();

		await elapse();

		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should send a slice again only when it changed', async () => {
		const { setFeedback, elapse, changeContent } = createPanel();
		await elapse();

		await changeContent('first');
		await changeContent('second');

		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should draw the slice of the column of each dial', async () => {
		const { panel, setFeedback, elapse } = createPanel({
			encodeSlice: (svg) => Promise.resolve(svg),
		});
		const secondFeedback = vi.fn(
			(_feedback: Readonly<Record<string, string>>) => Promise.resolve()
		);
		panel.attach({ id: 'second', column: 3, setFeedback: secondFeedback });

		await elapse();

		expect(setFeedback).toHaveBeenCalledWith({ canvas: 'first:0' });
		expect(secondFeedback).toHaveBeenCalledWith({ canvas: 'first:3' });
	});

	it('should stop following the content and the inactivity when the last dial disappears', async () => {
		const { panel, setFeedback, elapse, contentListeners } = createPanel();
		panel.detach('first');

		await elapse();

		expect(contentListeners.size).toBe(0);
		expect(panel.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should report a failing dial to the error handler without throwing', async () => {
		const { panel, elapse, onError } = createPanel();
		const failure = new Error('Cannot draw');
		panel.attach({
			id: 'broken',
			column: 1,
			setFeedback: () => Promise.reject(failure),
		});

		await elapse();

		expect(onError).toHaveBeenCalledWith(failure);
	});

	it('should report an error thrown while building a slice without throwing out of the timer', async () => {
		const failure = new Error('Cannot build');
		const { elapse, onError } = createPanel({
			encodeSlice: () => Promise.reject(failure),
		});

		await elapse();

		expect(onError).toHaveBeenCalledWith(failure);
	});
});
