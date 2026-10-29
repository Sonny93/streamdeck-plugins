import type { Scheduler } from 'deck-kit/async/scheduler';
import { describe, expect, it, vi } from 'vitest';

import { ProgressTicker } from './progress_ticker';

function buildTicker() {
	const pending: { callback: () => void; delay: number; cancelled: boolean }[] =
		[];
	const schedule: Scheduler = (callback, delay) => {
		const entry = { callback, delay, cancelled: false };
		pending.push(entry);
		return () => {
			entry.cancelled = true;
		};
	};
	const onTick = vi.fn();
	const ticker = new ProgressTicker({
		schedule,
		intervalMilliseconds: 1_000,
		onTick,
	});
	return { ticker, pending, onTick };
}

describe('ProgressTicker', () => {
	it('should schedule a tick when running', () => {
		const { ticker, pending } = buildTicker();

		ticker.restart(true);

		expect(pending.map((entry) => entry.delay)).toEqual([1_000]);
	});

	it('should not schedule anything when not running', () => {
		const { ticker, pending } = buildTicker();

		ticker.restart(false);

		expect(pending).toHaveLength(0);
	});

	it('should tick and schedule the next tick', () => {
		const { ticker, pending, onTick } = buildTicker();
		ticker.restart(true);

		pending[0]?.callback();

		expect(onTick).toHaveBeenCalledTimes(1);
		expect(pending).toHaveLength(2);
	});

	it('should cancel the pending tick on restart', () => {
		const { ticker, pending } = buildTicker();
		ticker.restart(true);

		ticker.restart(true);

		expect(pending.map((entry) => entry.cancelled)).toEqual([true, false]);
	});

	it('should cancel the pending tick when stopped', () => {
		const { ticker, pending } = buildTicker();
		ticker.restart(true);

		ticker.stop();

		expect(pending[0]?.cancelled).toBe(true);
	});
});
