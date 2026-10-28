import { describe, expect, it } from 'vitest';

import { buildVoltState } from './build_volt_state';
import { buildVoltStateReport } from './build_volt_state_report';
import { parseVoltStateReport } from './parse_volt_state_report';

describe('parseVoltStateReport', () => {
	it('reads every button as off when only the low bit is set', () => {
		expect(parseVoltStateReport(buildVoltStateReport(0x01))).toEqual(
			buildVoltState()
		);
	});

	it('reads the buttons that are on', () => {
		expect(parseVoltStateReport(buildVoltStateReport(0x51))).toEqual(
			buildVoltState({ monitor: true, vintage: true })
		);
		expect(parseVoltStateReport(buildVoltStateReport(0x09))).toEqual(
			buildVoltState({ phantomPower: true })
		);
	});

	it('ignores the other input reports', () => {
		expect(
			parseVoltStateReport(buildVoltStateReport(0x51, 0x04))
		).toBeUndefined();
	});

	it('ignores a report too short to hold a state', () => {
		expect(parseVoltStateReport(Uint8Array.from([0x02]))).toBeUndefined();
	});
});
