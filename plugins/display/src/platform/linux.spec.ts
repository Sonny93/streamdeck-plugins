import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { listRuntimeImports } from './list_runtime_imports';

describe('the Linux platform entry', () => {
	const imports = listRuntimeImports('platform/linux.ts');

	it('should load the Linux adapter', () => {
		expect(
			imports.some((file) => file.endsWith('create_linux_display_system.ts'))
		).toBe(true);
	});

	it('should never load a Windows module or koffi', () => {
		const windowsOnly = imports.filter((file) => {
			const segments = file.split(path.sep);
			return (
				segments.includes('windows') ||
				file.includes('koffi') ||
				file.endsWith('black_screens.ts') ||
				file.endsWith('platform/windows.ts')
			);
		});

		expect(windowsOnly).toEqual([]);
	});
});

describe('the Windows platform entry', () => {
	it('should not load the Linux adapter', () => {
		const imports = listRuntimeImports('platform/windows.ts');

		expect(imports.filter((file) => file.includes('/linux/'))).toEqual([]);
	});
});
