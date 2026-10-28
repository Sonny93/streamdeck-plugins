import { describe, expect, it } from 'vitest';

import { buildVoltState } from './build_volt_state';
import { isSameVoltStatus } from './is_same_volt_status';

describe('isSameVoltStatus', () => {
	it('compares the kinds of statuses without a state', () => {
		expect(
			isSameVoltStatus({ kind: 'disconnected' }, { kind: 'disconnected' })
		).toBe(true);
		expect(
			isSameVoltStatus({ kind: 'disconnected' }, { kind: 'waitingForState' })
		).toBe(false);
	});

	it('compares the buttons of two known states', () => {
		const monitorOn = {
			kind: 'ready',
			state: buildVoltState({ monitor: true }),
		} as const;

		expect(
			isSameVoltStatus(monitorOn, {
				kind: 'ready',
				state: buildVoltState({ monitor: true }),
			})
		).toBe(true);
		expect(
			isSameVoltStatus(monitorOn, { kind: 'ready', state: buildVoltState() })
		).toBe(false);
	});
});
