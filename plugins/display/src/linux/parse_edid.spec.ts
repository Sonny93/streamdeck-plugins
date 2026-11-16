import { describe, expect, it } from 'vitest';

import { buildEdidMonitorId } from './build_edid_monitor_id';
import { parseEdid } from './parse_edid';
import { readEdidFixture } from './read_fixture';

describe('parseEdid', () => {
	it('should read the Odyssey G95SD: ids, serial and model', () => {
		expect(parseEdid(readEdidFixture('edid_odyssey.hex'))).toEqual({
			manufacturerId: 'SAM',
			productCode: 'E05C',
			serial: '0000000000000',
			model: 'Odyssey G95SD',
		});
	});

	it('should tell two monitors of one model apart by their serial', () => {
		const first = parseEdid(readEdidFixture('edid_iiyama_a.hex'));
		const second = parseEdid(readEdidFixture('edid_iiyama_b.hex'));

		expect(first?.model).toBe('PL2530H');
		expect(first?.serial).not.toBe(second?.serial);
	});

	it('should give nothing for bytes that are not an EDID', () => {
		expect(parseEdid(new Uint8Array(256))).toBeUndefined();
		expect(parseEdid(new Uint8Array(4))).toBeUndefined();
	});
});

describe('buildEdidMonitorId', () => {
	it('should join the PnP id and the serial', () => {
		const edid = parseEdid(readEdidFixture('edid_iiyama_a.hex'));

		expect(edid && buildEdidMonitorId(edid)).toBe('IVM6133-0000000000002');
	});

	it('should keep the PnP id alone when the monitor has no serial', () => {
		expect(
			buildEdidMonitorId({
				manufacturerId: 'IVM',
				productCode: '6133',
				serial: undefined,
				model: undefined,
			})
		).toBe('IVM6133');
	});
});
