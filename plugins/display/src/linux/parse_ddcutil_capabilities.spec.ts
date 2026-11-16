import { describe, expect, it } from 'vitest';

import { parseVcpCapabilities } from '../displays/parse_vcp_capabilities';
import { pickStandbyMode } from '../displays/pick_standby_mode';
import { parseDdcutilCapabilities } from './parse_ddcutil_capabilities';
import { readFixture } from './read_fixture';

function pickStandbyModeOf(fixture: string): number | undefined {
	const raw = parseDdcutilCapabilities(readFixture(fixture));
	return raw === undefined
		? undefined
		: pickStandbyMode(parseVcpCapabilities(raw));
}

describe('parseDdcutilCapabilities', () => {
	it('should take the raw string of a real capture', () => {
		const raw = parseDdcutilCapabilities(
			readFixture('ddcutil_capabilities_verbose_iiyama.txt')
		);

		expect(raw?.startsWith('(prot(monitor)type(LCD)model(PL2530H)')).toBe(true);
		expect(raw?.endsWith('mccs_ver(2.2))')).toBe(true);
	});

	it('should give a string the standby picker can use', () => {
		expect(pickStandbyModeOf('ddcutil_capabilities_verbose_iiyama.txt')).toBe(
			5
		);
		expect(pickStandbyModeOf('ddcutil_capabilities_verbose_odyssey.txt')).toBe(
			4
		);
	});

	it('should give nothing when the output has no raw string', () => {
		expect(parseDdcutilCapabilities('Model: PL2530H\n')).toBeUndefined();
	});
});
