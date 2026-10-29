import { describe, expect, it } from 'vitest';

import { pickStandbyMode } from './pick_standby_mode';

describe('pickStandbyMode', () => {
	it('prefers "display off", which keeps the monitor awake to DDC/CI', () => {
		expect(pickStandbyMode(new Map([[0xd6, [0x01, 0x04, 0x05]]]))).toBe(0x04);
	});

	it('falls back to the other off modes the monitor lists', () => {
		expect(pickStandbyMode(new Map([[0xd6, [0x01, 0x05]]]))).toBe(0x05);
	});

	it('uses "display off" when the monitor lists no value', () => {
		expect(pickStandbyMode(new Map([[0xd6, []]]))).toBe(0x04);
	});

	it('gives nothing for a monitor without power mode', () => {
		expect(pickStandbyMode(new Map([[0x10, []]]))).toBeUndefined();
		expect(pickStandbyMode(new Map([[0xd6, [0x01]]]))).toBeUndefined();
	});
});
