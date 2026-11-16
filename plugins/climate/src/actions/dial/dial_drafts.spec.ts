import { createFakeScheduler } from 'deck-kit/async/create_fake_scheduler';
import { describe, expect, it, vi } from 'vitest';

import { buildUnitStateForTest } from '../../climate/build_unit_state_for_test';
import { DialDrafts } from './dial_drafts';

const HOLD = 600;
const IDLE = 10_000;
const DIAL = 'dial';

function createDrafts() {
	const scheduler = createFakeScheduler();
	const onChange = vi.fn();
	const drafts = new DialDrafts({
		schedule: scheduler.schedule,
		holdMilliseconds: HOLD,
		idleMilliseconds: IDLE,
		onChange,
	});
	return { drafts, scheduler, onChange };
}

const STATE = buildUnitStateForTest({ targetTemperature: 21 });

function rotate(drafts: DialDrafts, ticks: number, state = STATE): void {
	drafts.rotate({ dialId: DIAL, state, ticks, step: 0.5 });
}

describe('DialDrafts', () => {
	it('should start a draft from the displayed target when the dial rotates', () => {
		const { drafts, onChange } = createDrafts();

		rotate(drafts, 2);

		expect(drafts.read(DIAL, 'cool')).toBe(22);
		expect(onChange).toHaveBeenCalled();
	});

	it('should add the ticks of each rotation to the draft', () => {
		const { drafts } = createDrafts();

		rotate(drafts, 2);
		rotate(drafts, -1);

		expect(drafts.read(DIAL, 'cool')).toBe(21.5);
	});

	it('should keep the draft inside the range of the mode', () => {
		const { drafts } = createDrafts();

		rotate(drafts, 100);

		expect(drafts.read(DIAL, 'cool')).toBe(32);
	});

	it('should start no draft when the displayed mode has no setpoint', () => {
		const { drafts } = createDrafts();

		rotate(
			drafts,
			1,
			buildUnitStateForTest({ mode: 'dry', targetTemperature: null })
		);

		expect(drafts.read(DIAL, 'dry')).toBeUndefined();
	});

	it('should return the draft and clear it when a short press ends', () => {
		const { drafts } = createDrafts();
		rotate(drafts, 2);
		drafts.press(DIAL);

		const applied = drafts.release(DIAL);

		expect(applied).toBe(22);
		expect(drafts.read(DIAL, 'cool')).toBeUndefined();
	});

	it('should return nothing when a short press ends without draft', () => {
		const { drafts } = createDrafts();
		drafts.press(DIAL);

		expect(drafts.release(DIAL)).toBeUndefined();
	});

	it('should discard the draft at once when the dial stays down for the hold duration', async () => {
		const { drafts, scheduler, onChange } = createDrafts();
		rotate(drafts, 2);
		drafts.press(DIAL);
		onChange.mockClear();

		await scheduler.advance(HOLD);

		expect(drafts.read(DIAL, 'cool')).toBeUndefined();
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('should apply nothing when the dial goes up after the hold discarded the draft', async () => {
		const { drafts, scheduler } = createDrafts();
		rotate(drafts, 2);
		drafts.press(DIAL);
		await scheduler.advance(HOLD);

		expect(drafts.release(DIAL)).toBeUndefined();
	});

	it('should apply nothing when a draft is made while the dial is held down past the hold duration', async () => {
		const { drafts, scheduler } = createDrafts();
		drafts.press(DIAL);
		await scheduler.advance(HOLD);
		rotate(drafts, 2);

		expect(drafts.release(DIAL)).toBeUndefined();
	});

	it('should discard the draft after the idle delay without rotation', async () => {
		const { drafts, scheduler, onChange } = createDrafts();
		rotate(drafts, 2);
		onChange.mockClear();

		await scheduler.advance(IDLE);

		expect(drafts.read(DIAL, 'cool')).toBeUndefined();
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('should restart the idle delay when the dial rotates again', async () => {
		const { drafts, scheduler } = createDrafts();
		rotate(drafts, 2);
		await scheduler.advance(IDLE - 1);
		rotate(drafts, 1);

		await scheduler.advance(IDLE - 1);

		expect(drafts.read(DIAL, 'cool')).toBe(22.5);
	});

	it('should discard the draft when it is read for another mode than the one it was made for', () => {
		const { drafts } = createDrafts();
		rotate(drafts, 2);

		expect(drafts.read(DIAL, 'heat')).toBeUndefined();
		expect(drafts.read(DIAL, 'cool')).toBeUndefined();
	});

	it('should discard the draft and its timers when the dial disappears', async () => {
		const { drafts, scheduler, onChange } = createDrafts();
		rotate(drafts, 2);
		drafts.press(DIAL);
		onChange.mockClear();

		drafts.forget(DIAL);
		await scheduler.advance(IDLE);

		expect(drafts.read(DIAL, 'cool')).toBeUndefined();
		expect(onChange).not.toHaveBeenCalled();
	});

	it('should discard the drafts of every dial when asked to discard all', () => {
		const { drafts } = createDrafts();
		drafts.rotate({ dialId: 'first', state: STATE, ticks: 2, step: 0.5 });
		drafts.rotate({ dialId: 'second', state: STATE, ticks: -2, step: 0.5 });

		drafts.discardAll();

		expect([
			drafts.read('first', 'cool'),
			drafts.read('second', 'cool'),
		]).toEqual([undefined, undefined]);
	});

	it('should keep the drafts of different dials apart', () => {
		const { drafts } = createDrafts();

		drafts.rotate({ dialId: 'first', state: STATE, ticks: 2, step: 0.5 });
		drafts.rotate({ dialId: 'second', state: STATE, ticks: -2, step: 0.5 });

		expect([
			drafts.read('first', 'cool'),
			drafts.read('second', 'cool'),
		]).toEqual([22, 20]);
	});
});
