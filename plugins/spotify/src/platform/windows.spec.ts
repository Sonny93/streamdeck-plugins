import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
	collectTransitiveImports,
	PLATFORM_DIRECTORY,
} from './collect_transitive_imports';

describe('the Windows host', () => {
	const imports = [
		...collectTransitiveImports(path.join(PLATFORM_DIRECTORY, 'windows.ts')),
	];

	it('should never import resvg', () => {
		expect(
			imports.filter((specifier) => specifier.includes('resvg'))
		).toStrictEqual([]);
	});

	it('should never import a Linux module', () => {
		expect(
			imports.filter((specifier) =>
				/[\\/]linux[\\/]|platform[\\/]linux/.test(specifier)
			)
		).toStrictEqual([]);
	});
});
