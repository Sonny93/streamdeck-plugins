import { describe, expect, it } from 'vitest';

import type { Scheduler } from '../async/scheduler';
import { WakeGate } from './wake_gate';

const QUIET = 300;

function createGate() {
	let now = 0;
	const tasks: { dueAt: number; callback: () => void; isCancelled: boolean }[] =
		[];
	const schedule: Scheduler = (callback, delay) => {
		const task = { dueAt: now + delay, callback, isCancelled: false };
		tasks.push(task);
		return () => {
			task.isCancelled = true;
		};
	};
	function advance(milliseconds: number): void {
		now += milliseconds;
		for (const task of tasks.filter(
			(entry) => !entry.isCancelled && entry.dueAt <= now
		)) {
			task.isCancelled = true;
			task.callback();
		}
	}
	return {
		gate: new WakeGate({ schedule, quietMilliseconds: QUIET }),
		advance,
	};
}

describe('WakeGate', () => {
	it('should swallow nothing when the panel was not showing', () => {
		const { gate } = createGate();

		expect(gate.swallow('other', false)).toBe(false);
		expect(gate.swallow('press', false)).toBe(false);
		expect(gate.swallow('release', false)).toBe(false);
	});

	it('should swallow the event that woke the panel', () => {
		const { gate } = createGate();

		expect(gate.swallow('other', true)).toBe(true);
	});

	it('should swallow a continuous rotation entirely, however long it lasts', () => {
		const { gate, advance } = createGate();
		const results = [gate.swallow('other', true)];

		for (let tick = 0; tick < 20; tick += 1) {
			advance(QUIET - 1);
			results.push(gate.swallow('other', false));
		}

		expect(results.every(Boolean)).toBe(true);
	});

	it('should let an event act once the dials were left alone for the quiet period', () => {
		const { gate, advance } = createGate();
		gate.swallow('other', true);

		advance(QUIET);

		expect(gate.swallow('other', false)).toBe(false);
	});

	it('should keep swallowing just before the quiet period ends', () => {
		const { gate, advance } = createGate();
		gate.swallow('other', true);

		advance(QUIET - 1);

		expect(gate.swallow('other', false)).toBe(true);
	});

	it('should restart the quiet period on every swallowed event', () => {
		const { gate, advance } = createGate();
		gate.swallow('other', true);
		advance(QUIET - 1);
		gate.swallow('other', false);

		advance(QUIET - 1);

		expect(gate.swallow('other', false)).toBe(true);
	});

	it('should swallow the push up of a swallowed push down, even after the quiet period', () => {
		const { gate, advance } = createGate();
		gate.swallow('press', true);

		advance(QUIET * 10);

		expect(gate.swallow('release', false)).toBe(true);
	});

	it('should let the next press act once a swallowed press has ended and the dials were left alone', () => {
		const { gate, advance } = createGate();
		gate.swallow('press', true);
		gate.swallow('release', false);
		advance(QUIET);

		expect(gate.swallow('press', false)).toBe(false);
		expect(gate.swallow('release', false)).toBe(false);
	});

	it('should not swallow the push up of a push down that acted', () => {
		const { gate, advance } = createGate();
		gate.swallow('other', true);
		advance(QUIET);

		const down = gate.swallow('press', false);
		advance(QUIET * 10);

		expect(down).toBe(false);
		expect(gate.swallow('release', false)).toBe(false);
	});
});
