import { describe, expect, it } from 'vitest';

import type { AudioApp } from './audio_app';
import { findForegroundApp } from './find_foreground_app';

function buildApp(overrides: Partial<AudioApp>): AudioApp {
	return {
		imageName: 'firefox',
		displayName: 'Firefox',
		volume: 0.5,
		isMuted: false,
		...overrides,
	};
}

const GAME = buildApp({
	imageName: 'BeamNG.drive.x64',
	displayName: 'BeamNG.drive',
	processIds: [49_021, 4000],
});
const BROWSER = buildApp({ processIds: [7001, 7000, 4000] });

describe('findForegroundApp', () => {
	it('should find an app by the process of the foreground window even when it renamed itself', () => {
		expect(
			findForegroundApp([BROWSER, GAME], {
				imageName: '===>>> BeamNGMa',
				processId: 49_021,
			})
		).toBe(GAME);
	});

	it('should find an app playing from a process the window process started', () => {
		expect(
			findForegroundApp([GAME, BROWSER], {
				imageName: 'unrelated',
				processId: 7000,
			})
		).toBe(BROWSER);
	});

	it('should prefer the app whose stream is the closest to the window process', () => {
		const direct = buildApp({ imageName: 'a', processIds: [10, 4000] });
		const distant = buildApp({ imageName: 'b', processIds: [11, 12, 10] });

		expect(
			findForegroundApp([distant, direct], { imageName: 'x', processId: 10 })
		).toBe(direct);
	});

	it('should fall back to the executable name when no process matches', () => {
		expect(
			findForegroundApp([GAME, BROWSER], {
				imageName: 'Firefox.exe',
				processId: 1,
			})
		).toBe(BROWSER);
	});

	it('should match by name alone without a process id, as on Windows', () => {
		expect(
			findForegroundApp([buildApp({})], { imageName: 'firefox.exe' })
		).toMatchObject({ imageName: 'firefox' });
	});

	it('should return undefined when nothing matches', () => {
		expect(
			findForegroundApp([GAME], { imageName: 'vlc', processId: 5 })
		).toBeUndefined();
	});
});
