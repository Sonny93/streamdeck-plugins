import { describe, expect, it } from 'vitest';

import { VoltKeyState } from './volt_key_state';
import { buildVoltState } from '../volt/build_volt_state';
import { resolveVoltKeyState } from './resolve_volt_key_state';

describe('resolveVoltKeyState', () => {
	it('shows whether the button of the key is on', () => {
		const status = {
			kind: 'ready',
			state: buildVoltState({ vintage: true }),
		} as const;

		expect(resolveVoltKeyState(status, 'vintage')).toBe(VoltKeyState.on);
		expect(resolveVoltKeyState(status, 'monitor')).toBe(VoltKeyState.off);
	});

	it('dims the key while the state is unknown', () => {
		expect(resolveVoltKeyState({ kind: 'disconnected' }, 'monitor')).toBe(
			VoltKeyState.unavailable
		);
		expect(resolveVoltKeyState({ kind: 'waitingForState' }, 'monitor')).toBe(
			VoltKeyState.unavailable
		);
	});
});
