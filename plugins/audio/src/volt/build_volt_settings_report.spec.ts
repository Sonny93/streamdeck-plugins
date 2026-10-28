import { describe, expect, it } from 'vitest';

import { buildVoltSettingsReport } from './build_volt_settings_report';
import { buildVoltState } from './build_volt_state';

describe('buildVoltSettingsReport', () => {
	it('builds a 17 byte settings report', () => {
		const report = buildVoltSettingsReport(buildVoltState());

		expect(report).toHaveLength(17);
		expect([...report]).toEqual([0x10, ...Array.from({ length: 16 }, () => 0)]);
	});

	it('writes the setting bit of every button that is on', () => {
		expect(
			buildVoltSettingsReport(
				buildVoltState({ monitor: true, phantomPower: true })
			)[1]
		).toBe(0x06);
		expect(buildVoltSettingsReport(buildVoltState({ vintage: true }))[1]).toBe(
			0x40
		);
	});
});
