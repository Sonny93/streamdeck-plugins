import { describe, expect, it } from 'vitest';

import { buildUnitStateForTest } from '../../climate/build_unit_state_for_test';
import { moveDraft } from './move_draft';

describe('moveDraft', () => {
	it.each([
		[1, 0.5, 21.5],
		[-3, 0.5, 19.5],
		[2, 1, 23],
		[-2, 1, 19],
	])(
		'should start from the displayed target and move it by %s ticks of %s degrees',
		(ticks, step, expected) => {
			const state = buildUnitStateForTest({ targetTemperature: 21 });

			expect(moveDraft({ draft: undefined, state, ticks, step })).toEqual({
				temperature: expected,
				mode: 'cool',
			});
		}
	);

	it('should move the draft and not the displayed target when a draft exists', () => {
		const state = buildUnitStateForTest({ targetTemperature: 21 });

		const draft = moveDraft({
			draft: { temperature: 25, mode: 'cool' },
			state,
			ticks: 2,
			step: 0.5,
		});

		expect(draft?.temperature).toBe(26);
	});

	it('should start again from the displayed target when the draft was made for another mode', () => {
		const state = buildUnitStateForTest({
			mode: 'heat',
			targetTemperature: 20,
		});

		const draft = moveDraft({
			draft: { temperature: 25, mode: 'cool' },
			state,
			ticks: 1,
			step: 1,
		});

		expect(draft).toEqual({ temperature: 21, mode: 'heat' });
	});

	it('should stop at the maximum of the mode when the rotation goes past it', () => {
		const state = buildUnitStateForTest({
			mode: 'heat',
			targetTemperature: 29.5,
		});

		expect(
			moveDraft({ draft: undefined, state, ticks: 10, step: 1 })?.temperature
		).toBe(30);
	});

	it('should stop at the minimum of the mode when the rotation goes below it', () => {
		const state = buildUnitStateForTest({
			mode: 'cool',
			targetTemperature: 18.5,
		});

		expect(
			moveDraft({ draft: undefined, state, ticks: -10, step: 1 })?.temperature
		).toBe(18);
	});

	it.each(['dry', 'fan'] as const)(
		'should choose nothing when the displayed mode is %s',
		(mode) => {
			const state = buildUnitStateForTest({ mode, targetTemperature: null });

			expect(
				moveDraft({ draft: undefined, state, ticks: 1, step: 0.5 })
			).toBeUndefined();
		}
	);

	it('should choose nothing when the displayed target is unknown', () => {
		const state = buildUnitStateForTest({ targetTemperature: null });

		expect(
			moveDraft({ draft: undefined, state, ticks: 1, step: 0.5 })
		).toBeUndefined();
	});
});
