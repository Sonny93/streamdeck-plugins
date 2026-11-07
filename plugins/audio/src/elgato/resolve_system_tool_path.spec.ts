import { describe, expect, it } from 'vitest';

import { resolveSystemToolPath } from './resolve_system_tool_path';

describe('resolveSystemToolPath', () => {
	it('should use SystemRoot from the environment', () => {
		expect(
			resolveSystemToolPath('tasklist.exe', { SystemRoot: 'D:\\Win' })
		).toBe('D:\\Win\\System32\\tasklist.exe');
	});

	it('should fall back to C:\\Windows when SystemRoot is missing', () => {
		expect(resolveSystemToolPath('taskkill.exe', {})).toBe(
			'C:\\Windows\\System32\\taskkill.exe'
		);
	});
});
