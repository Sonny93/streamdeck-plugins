import { describe, expect, it } from 'vitest';

import { resolveExecutableImageName } from './resolve_executable_image_name';

describe('resolveExecutableImageName', () => {
	it('should use the executable name, not a renamed comm', () => {
		expect(
			resolveExecutableImageName({
				executablePath: '/games/Example/BinLinux/Game.x64',
				command: '===>>> GameMa',
			})
		).toBe('Game.x64');
	});

	it('should drop the suffix Linux adds to a replaced executable', () => {
		expect(
			resolveExecutableImageName({
				executablePath: '/usr/lib/firefox/firefox (deleted)',
				command: 'firefox',
			})
		).toBe('firefox');
	});

	it('should use the comm for a Wine preloader', () => {
		expect(
			resolveExecutableImageName({
				executablePath: '/usr/bin/wine64-preloader',
				command: 'Game.exe',
			})
		).toBe('Game.exe');
	});

	it('should fall back to the comm when the executable is unreadable', () => {
		expect(
			resolveExecutableImageName({
				executablePath: undefined,
				command: 'firefox\n',
			})
		).toBe('firefox');
	});

	it('should return undefined when neither is known', () => {
		expect(
			resolveExecutableImageName({ executablePath: undefined, command: '' })
		).toBeUndefined();
	});
});
