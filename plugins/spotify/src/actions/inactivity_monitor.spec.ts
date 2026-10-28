import { describe, expect, it, vi } from 'vitest';

import type { CarouselScheduler } from './carousel_scheduler';
import { InactivityMonitor } from './inactivity_monitor';

const DELAY = 30_000;

function buildMonitor() {
	const pending: { callback: () => void; delay: number; cancelled: boolean }[] =
		[];
	const schedule: CarouselScheduler = (callback, delay) => {
		const entry = { callback, delay, cancelled: false };
		pending.push(entry);
		return () => {
			entry.cancelled = true;
		};
	};
	const monitor = new InactivityMonitor({ delayMilliseconds: DELAY, schedule });
	return {
		monitor,
		pending,
		elapse: (): void => {
			for (const entry of pending.splice(0)) {
				if (!entry.cancelled) {
					entry.callback();
				}
			}
		},
	};
}

describe('InactivityMonitor', () => {
	it('should start active', () => {
		const { monitor } = buildMonitor();

		expect(monitor.isInactive).toBe(false);
	});

	it('should count down the delay from its creation', () => {
		const { pending } = buildMonitor();

		expect(pending.map((entry) => entry.delay)).toEqual([DELAY]);
	});

	it('should become inactive once the delay elapsed', () => {
		const { monitor, elapse } = buildMonitor();

		elapse();

		expect(monitor.isInactive).toBe(true);
	});

	it('should tell its listeners when it becomes inactive', () => {
		const { monitor, elapse } = buildMonitor();
		const listener = vi.fn();
		monitor.subscribe(listener);

		elapse();

		expect(listener).toHaveBeenCalledWith(true);
	});

	it('should restart the countdown on an interaction', () => {
		const { monitor, elapse } = buildMonitor();

		monitor.recordActivity();
		elapse();

		expect(monitor.isInactive).toBe(true);
	});

	it('should cancel the previous countdown on an interaction', () => {
		const { monitor, pending } = buildMonitor();

		monitor.recordActivity();

		expect(pending.map((entry) => entry.cancelled)).toEqual([true, false]);
	});

	it('should become active again on an interaction and tell its listeners', () => {
		const { monitor, elapse } = buildMonitor();
		const listener = vi.fn();
		elapse();
		monitor.subscribe(listener);

		monitor.recordActivity();

		expect(monitor.isInactive).toBe(false);
		expect(listener).toHaveBeenCalledWith(false);
	});

	it('should report whether it was inactive when an interaction is recorded', () => {
		const { monitor, elapse } = buildMonitor();
		elapse();

		expect(monitor.recordActivity()).toBe(true);
		expect(monitor.recordActivity()).toBe(false);
	});

	it('should not tell its listeners about an interaction while active', () => {
		const { monitor } = buildMonitor();
		const listener = vi.fn();
		monitor.subscribe(listener);

		monitor.recordActivity();

		expect(listener).not.toHaveBeenCalled();
	});

	it('should stop telling a listener that unsubscribed', () => {
		const { monitor, elapse } = buildMonitor();
		const listener = vi.fn();
		const unsubscribe = monitor.subscribe(listener);

		unsubscribe();
		elapse();

		expect(listener).not.toHaveBeenCalled();
	});
});
