import { describe, expect, it } from 'vitest';

import { isVoltInterfacePath } from './is_volt_interface_path';

describe('isVoltInterfacePath', () => {
	it('accepts the vendor collection of the Volt 1', () => {
		expect(
			isVoltInterfacePath(
				'\\\\?\\HID#VID_2B5A&PID_0020&REV_0100&MI_06#b&1f40bbdf&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}'
			)
		).toBe(true);
	});

	it('rejects other HID devices', () => {
		expect(
			isVoltInterfacePath(
				'\\\\?\\HID#VID_046D&PID_C52B&MI_02&Col01#8&2b0b3c4&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}'
			)
		).toBe(false);
	});
});
