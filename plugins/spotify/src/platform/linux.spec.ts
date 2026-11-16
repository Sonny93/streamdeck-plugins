import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
	collectTransitiveImports,
	PLATFORM_DIRECTORY,
} from './collect_transitive_imports';

describe('the Linux host', () => {
	const imports = [
		...collectTransitiveImports(path.join(PLATFORM_DIRECTORY, 'linux.ts')),
	];

	it('should never import koffi', () => {
		expect(
			imports.filter((specifier) => specifier.includes('koffi'))
		).toStrictEqual([]);
	});

	it('should never import a Windows module', () => {
		expect(
			imports.filter((specifier) =>
				/[\\/]windows[\\/]|windows_audio_mixer|platform[\\/]windows/.test(
					specifier
				)
			)
		).toStrictEqual([]);
	});

	it('should reach its own modules, so the scan is not empty', () => {
		expect(
			imports.some((specifier) => specifier.endsWith('kill_spotify.ts'))
		).toBe(true);
	});
});
