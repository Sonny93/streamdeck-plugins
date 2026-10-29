import { describe, expect, it } from 'vitest';

import { parseVcpCapabilities } from './parse_vcp_capabilities';

const IIYAMA_CAPABILITIES =
	'(prot(monitor)type(LCD)model(PL2530H)cmds(01 02 03 07 0C E3 F3)vcp(04 05 10 12 14(05 06 08 0B) 16 18 1A 52 60(01 0F 11) 62 8D AC AE B2 B6 C0 C6 C9 CC(02 03 04 05 06 09 0A 0D 12 14 1E) D6(01 05) DF)mswhql(1)asset_eep(40)mccs_ver(2.2))';
const SAMSUNG_CAPABILITIES =
	'(prot(monitor)type(lcd)model(FALCON)cmds(01 02 03 07 0C 4E F3 E3)vcp(02 04 05 06 08 0B 0C 0E 10 12 14(01 04 05 06 07 08 0A 0B) 16 18 1A 1E 20 30 3E 6C 6E 70 AC AE B6 C0 C6 C8 C9 CA CC(00 02 03 04 05 08 09 0A 0D) D6(01 04) DC(00 01 02 03 04) DF 60(01 03) 62 8D FF)mswhql(1)mccs_ver(2.0)asset_eep(32)mpu_ver(01))';

describe('parseVcpCapabilities', () => {
	it('reads the codes and the values listed for them', () => {
		const capabilities = parseVcpCapabilities(IIYAMA_CAPABILITIES);

		expect(capabilities.get(0x10)).toEqual([]);
		expect(capabilities.get(0xd6)).toEqual([0x01, 0x05]);
		expect(capabilities.get(0x60)).toEqual([0x01, 0x0f, 0x11]);
		expect(capabilities.has(0xdf)).toBe(true);
	});

	it('stops at the end of the vcp section', () => {
		const capabilities = parseVcpCapabilities(SAMSUNG_CAPABILITIES);

		expect(capabilities.get(0xd6)).toEqual([0x01, 0x04]);
		expect(capabilities.has(0xff)).toBe(true);
		expect(capabilities.has(0x32)).toBe(false);
	});

	it('gives nothing for a string without vcp section', () => {
		expect(parseVcpCapabilities('(prot(monitor))').size).toBe(0);
	});
});
