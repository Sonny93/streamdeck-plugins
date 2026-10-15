import { describe, expect, it } from 'vitest';

import { parseGuid } from './parse_guid';

describe('parseGuid', () => {
	it('should split a GUID into the fields of the Win32 struct', () => {
		expect(parseGuid('BCDE0395-E52F-467C-8E3D-C4579291692E')).toEqual({
			Data1: 0xbc_de_03_95,
			Data2: 0xe5_2f,
			Data3: 0x46_7c,
			Data4: [0x8e, 0x3d, 0xc4, 0x57, 0x92, 0x91, 0x69, 0x2e],
		});
	});

	it('should accept lowercase digits', () => {
		expect(parseGuid('bfb7ff88-7239-4fc9-8fa2-07c950be9c6d').Data1).toBe(
			0xbf_b7_ff_88
		);
	});

	it('should reject a text that is not a GUID', () => {
		expect(() => parseGuid('not-a-guid')).toThrow(TypeError);
	});
});
