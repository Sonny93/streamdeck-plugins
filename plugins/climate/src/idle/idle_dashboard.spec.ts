import { createFakeScheduler } from 'deck-kit/async/create_fake_scheduler';
import { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import { IdleTiming } from 'deck-kit/strip/idle_timing';
import { describe, expect, it, vi } from 'vitest';

import { buildClimateViewForTest } from '../climate/build_climate_view_for_test';
import type { ClimateView } from '../climate/climate_view';
import { createIdleDashboard } from './create_idle_dashboard';

const DELAY = 5000;

function createIdle(initialView: ClimateView = buildClimateViewForTest()) {
	const scheduler = createFakeScheduler();
	const inactivity = new InactivityMonitor({
		delayMilliseconds: DELAY,
		schedule: scheduler.schedule,
	});
	const hubListeners = new Set<(view: ClimateView) => void>();
	const hub = {
		view: initialView,
		subscribe: (listener: (view: ClimateView) => void) => {
			hubListeners.add(listener);
			return () => {
				hubListeners.delete(listener);
			};
		},
	};
	const onError = vi.fn();
	const idle = createIdleDashboard({
		inactivity,
		schedule: scheduler.schedule,
		hub,
		onError,
	});
	const setFeedback = vi.fn((_feedback: Readonly<Record<string, string>>) =>
		Promise.resolve()
	);
	idle.attach({ id: 'first', column: 0, setFeedback });
	async function changeView(view: ClimateView): Promise<void> {
		hub.view = view;
		for (const listener of hubListeners) {
			listener(view);
		}
		await scheduler.settle();
	}
	return {
		idle,
		scheduler,
		hub,
		hubListeners,
		setFeedback,
		changeView,
		onError,
	};
}

describe('IdleDashboard', () => {
	it('should not show before the inactivity delay', async () => {
		const { idle, scheduler, setFeedback } = createIdle();

		await scheduler.advance(DELAY - 1);

		expect(idle.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should draw its slice on the dial once the delay elapsed and the unit is ready', async () => {
		const { idle, scheduler, setFeedback } = createIdle();

		await scheduler.advance(DELAY);

		expect(idle.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(1);
		expect(setFeedback.mock.calls[0]?.[0]).toHaveProperty('canvas');
	});

	it('should never show while the unit is not ready', async () => {
		const { idle, scheduler, setFeedback } = createIdle(
			buildClimateViewForTest({ status: 'unreachable' })
		);

		await scheduler.advance(DELAY * 2);

		expect(idle.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should show when the unit becomes ready while the dials are inactive', async () => {
		const { idle, scheduler, changeView, setFeedback } = createIdle(
			buildClimateViewForTest({ status: 'loading' })
		);
		await scheduler.advance(DELAY);

		await changeView(buildClimateViewForTest());

		expect(idle.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should hide and tell the dials to draw their own content when the unit stops being ready', async () => {
		const { idle, scheduler, changeView } = createIdle();
		const onHidden = vi.fn();
		idle.onHidden(onHidden);
		await scheduler.advance(DELAY);

		await changeView(buildClimateViewForTest({ status: 'unreachable' }));

		expect(idle.isShowing).toBe(false);
		expect(onHidden).toHaveBeenCalledTimes(1);
	});

	it('should only wake the dials while the gesture that woke them goes on', async () => {
		const { idle, scheduler } = createIdle();
		const onHidden = vi.fn();
		idle.onHidden(onHidden);
		await scheduler.advance(DELAY);

		const firstWasWakeOnly = idle.wake();
		await scheduler.advance(IdleTiming.wakeQuietMilliseconds - 1);
		const secondWasWakeOnly = idle.wake();
		await scheduler.advance(IdleTiming.wakeQuietMilliseconds);
		const thirdActs = !idle.wake();

		expect([firstWasWakeOnly, secondWasWakeOnly, thirdActs]).toEqual([
			true,
			true,
			true,
		]);
		expect(idle.isShowing).toBe(false);
		expect(onHidden).toHaveBeenCalledTimes(1);
	});

	it('should not report a wake while the dashboard is not showing', () => {
		const { idle } = createIdle();

		expect(idle.wake()).toBe(false);
	});

	it('should show again after another inactivity delay and draw the slice again', async () => {
		const { idle, scheduler, setFeedback } = createIdle();
		await scheduler.advance(DELAY);
		idle.wake();

		await scheduler.advance(DELAY);

		expect(idle.isShowing).toBe(true);
		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should draw again when the view changes while showing, and not when the picture is the same', async () => {
		const { scheduler, changeView, setFeedback } = createIdle();
		await scheduler.advance(DELAY);

		await changeView(
			buildClimateViewForTest({ sensors: { indoorTemperature: 25 } })
		);
		await changeView(
			buildClimateViewForTest({ sensors: { indoorTemperature: 25 } })
		);

		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should tell the listeners when it takes the strip over, so a draft can be dropped', async () => {
		const { idle, scheduler } = createIdle();
		const onShown = vi.fn();
		idle.onShown(onShown);

		await scheduler.advance(DELAY);

		expect(onShown).toHaveBeenCalledTimes(1);
	});

	it('should draw a different slice on each dial when they sit in different columns', async () => {
		const { idle, scheduler, setFeedback } = createIdle();
		const secondFeedback = vi.fn(
			(_feedback: Readonly<Record<string, string>>) => Promise.resolve()
		);
		idle.attach({ id: 'second', column: 2, setFeedback: secondFeedback });

		await scheduler.advance(DELAY);

		expect(setFeedback.mock.calls[0]?.[0]).not.toEqual(
			secondFeedback.mock.calls[0]?.[0]
		);
	});

	it('should stop following the hub and the inactivity when the last dial disappears', async () => {
		const { idle, scheduler, hubListeners, setFeedback } = createIdle();
		idle.detach('first');

		await scheduler.advance(DELAY * 2);

		expect(hubListeners.size).toBe(0);
		expect(idle.isShowing).toBe(false);
		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should report a failing dial to the error handler without throwing', async () => {
		const { idle, scheduler, onError } = createIdle();
		const failure = new Error('Cannot draw');
		idle.attach({
			id: 'broken',
			column: 1,
			setFeedback: () => Promise.reject(failure),
		});

		await scheduler.advance(DELAY);

		expect(onError).toHaveBeenCalledWith(failure);
	});
});
