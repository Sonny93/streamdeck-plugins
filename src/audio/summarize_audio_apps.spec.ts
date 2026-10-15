import { describe, expect, it } from 'vitest';

import { summarizeAudioApps } from './summarize_audio_apps';
import type { AudioSessionSnapshot } from '../windows/audio_session_snapshot';

const SPOTIFY_PATH =
	'C:\\Program Files\\WindowsApps\\SpotifyAB.SpotifyMusic_x64\\Spotify.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\msedge.exe';

function session(
	overrides: Partial<AudioSessionSnapshot>
): AudioSessionSnapshot {
	return {
		processId: 1,
		imagePath: SPOTIFY_PATH,
		volume: 0.5,
		isMuted: false,
		...overrides,
	};
}

describe('summarizeAudioApps', () => {
	it('should give one app per executable with a readable name', () => {
		expect(summarizeAudioApps([session({})])).toEqual([
			{
				imageName: 'Spotify.exe',
				displayName: 'Spotify',
				volume: 0.5,
				isMuted: false,
			},
		]);
	});

	it('should leave out the system sounds', () => {
		expect(
			summarizeAudioApps([session({ processId: 0, imagePath: undefined })])
		).toEqual([]);
	});

	it('should merge the sessions of one executable, ignoring case', () => {
		const apps = summarizeAudioApps([
			session({ volume: 0.2 }),
			session({ imagePath: SPOTIFY_PATH.toLowerCase(), volume: 0.7 }),
		]);

		expect(apps).toHaveLength(1);
		expect(apps[0]?.volume).toBe(0.7);
	});

	it('should count a merged app as muted only when every session is', () => {
		const apps = summarizeAudioApps([
			session({ isMuted: true }),
			session({ isMuted: false }),
		]);

		expect(apps[0]?.isMuted).toBe(false);
	});

	it('should count a merged app as muted when every session is', () => {
		const apps = summarizeAudioApps([
			session({ isMuted: true }),
			session({ isMuted: true }),
		]);

		expect(apps[0]?.isMuted).toBe(true);
	});

	it('should sort the apps by readable name', () => {
		const apps = summarizeAudioApps([
			session({}),
			session({ imagePath: EDGE_PATH }),
		]);

		expect(apps.map((app) => app.displayName)).toEqual(['Msedge', 'Spotify']);
	});
});
