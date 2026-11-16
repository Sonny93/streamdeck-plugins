import { describe, expect, it } from 'vitest';

import { selectMainSpotifyProcesses } from './select_main_spotify_processes';

describe('selectMainSpotifyProcesses', () => {
	it('should keep the process whose parent is not a Spotify process', () => {
		expect(
			selectMainSpotifyProcesses([
				{ processId: 20, parentId: 10 },
				{ processId: 21, parentId: 20 },
				{ processId: 22, parentId: 21 },
			])
		).toStrictEqual([{ processId: 20, parentId: 10 }]);
	});

	it('should keep every main process when two Spotify instances run', () => {
		expect(
			selectMainSpotifyProcesses([
				{ processId: 20, parentId: 10 },
				{ processId: 50, parentId: 10 },
				{ processId: 51, parentId: 50 },
			])
		).toHaveLength(2);
	});

	it('should return nothing when no Spotify process runs', () => {
		expect(selectMainSpotifyProcesses([])).toStrictEqual([]);
	});
});
