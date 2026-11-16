import { describe, expect, it } from 'vitest';

import type { RawRecord } from '../raw_record';
import { applySpecialMode } from './apply_special_mode';

describe('applySpecialMode', () => {
	it.each([
		['', '1', '1', '2'],
		['', '1', '2', '12'],
		['2', '1', '2', '12'],
		['12', '1', '1', '2'],
		['2', '0', '1', ''],
		['12', '0', '2', ''],
		['2/13', '1', '2', '13/12'],
		['2/13', '0', '1', '13'],
		['12', '0', '1', '12'],
	])(
		'should turn adv %j into %j when set_spmode is %s and spmode_kind is %s',
		(currentAdv, setMode, kind, expected) => {
			const params = { set_spmode: setMode, spmode_kind: kind };

			expect(applySpecialMode(currentAdv, params)).toBe(expected);
		}
	);

	it.each<RawRecord>([
		{ set_spmode: '2', spmode_kind: '1' },
		{ set_spmode: '1', spmode_kind: '3' },
		{ set_spmode: '1' },
		{ spmode_kind: '1' },
	])('should return null when the params are %j', (params) => {
		expect(applySpecialMode('', params)).toBeNull();
	});
});
