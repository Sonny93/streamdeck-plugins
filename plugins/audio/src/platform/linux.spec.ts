import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { collectTransitiveImports } from './collect_transitive_imports';

const WINDOWS_FOLDER_PATTERN = /[\\/]windows[\\/]/u;
const KOFFI_PATTERN = /^koffi(?:\/|$)/u;

describe('linux adapters', () => {
	const imports = collectTransitiveImports(
		path.resolve(import.meta.dirname, 'linux.ts')
	);

	it('should reach the Linux audio and Volt 1 modules', () => {
		const names = [...imports.files].map((file) => path.basename(file));

		expect(names).toContain('create_linux_core_audio.ts');
		expect(names).toContain('open_linux_volt_connection.ts');
	});

	it('should never import koffi', () => {
		const koffiImports = [...imports.externalSpecifiers].filter((specifier) =>
			KOFFI_PATTERN.test(specifier)
		);

		expect(koffiImports).toEqual([]);
	});

	it('should never import a Windows module', () => {
		const windowsFiles = [...imports.files].filter((file) =>
			WINDOWS_FOLDER_PATTERN.test(file)
		);

		expect(windowsFiles).toEqual([]);
	});
});
