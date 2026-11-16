import { describe, expect, it } from 'vitest';

import { applySetControlInfo } from './apply_set_control_info';
import { FAKE_UNIT_DEFAULTS } from './fake_unit_defaults';

const { controlInfo, modelInfo } = FAKE_UNIT_DEFAULTS;
const VALID_PARAMS = {
	pow: '1',
	mode: '4',
	stemp: '20.0',
	shum: '0',
	f_rate: 'A',
	f_dir: '0',
};

describe('applySetControlInfo', () => {
	it('should return null when one of the 6 params is missing', () => {
		const { shum: _shum, ...withoutShum } = VALID_PARAMS;

		expect(applySetControlInfo(controlInfo, modelInfo, withoutShum)).toBeNull();
	});

	it.each([
		['mode', '5'],
		['stemp', 'abc'],
		['stemp', '99.0'],
	])('should return null when %s is %s', (key, value) => {
		expect(
			applySetControlInfo(controlInfo, modelInfo, {
				...VALID_PARAMS,
				[key]: value,
			})
		).toBeNull();
	});

	it('should memorize the written values for the mode', () => {
		const updated = applySetControlInfo(controlInfo, modelInfo, VALID_PARAMS);

		expect(updated).toMatchObject({
			mode: '4',
			stemp: '20.0',
			dt4: '20.0',
			dfr4: 'A',
		});
	});

	it('should accept absent markers for stemp and shum when writing fan mode', () => {
		const updated = applySetControlInfo(controlInfo, modelInfo, {
			...VALID_PARAMS,
			mode: '6',
			stemp: '--',
			shum: '--',
		});

		expect(updated).toMatchObject({ mode: '6', stemp: '--', shum: '--' });
	});

	it('should normalize f_dir to 0 when the model says swing is unsupported', () => {
		const noSwing = { ...modelInfo, s_fdir: '0' };

		const updated = applySetControlInfo(controlInfo, noSwing, {
			...VALID_PARAMS,
			f_dir: '3',
		});

		expect(updated).toMatchObject({ f_dir: '0', dfd4: '0' });
	});
});
