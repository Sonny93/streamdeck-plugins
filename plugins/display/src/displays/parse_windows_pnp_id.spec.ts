import { describe, expect, it } from 'vitest';

import { buildMonitorId } from './build_monitor_id';
import { parseWindowsPnpId } from './parse_windows_pnp_id';

describe('parseWindowsPnpId', () => {
	it('splits the PnP id of a device path into manufacturer id and product code', () => {
		expect(parseWindowsPnpId(buildMonitorId('SAME05C', 4353))).toEqual({
			manufacturerId: 'SAM',
			productCode: 'E05C',
		});
	});

	it('gives empty ids for a path that is not a monitor path', () => {
		expect(parseWindowsPnpId('unknown')).toEqual({
			manufacturerId: '',
			productCode: '',
		});
	});
});
