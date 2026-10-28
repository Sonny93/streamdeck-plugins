import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parsePluginManifest } from './parse_plugin_manifest.ts';
import { ProfilePaths } from './profile_paths.ts';
import { SpotifyDeckLayout } from './spotify_deck_layout.ts';

const placements = [
	...SpotifyDeckLayout.keys,
	...SpotifyDeckLayout.encoders,
	...SpotifyDeckLayout.folders.flatMap((folder) => [
		...folder.keys,
		...folder.encoders,
	]),
];
const builtInActionIds = SpotifyDeckLayout.folders.flatMap((folder) => [
	folder.actionId,
	folder.backActionId,
]);

function readRealManifest(): ReturnType<typeof parsePluginManifest> {
	const manifestPath = join(
		import.meta.dirname,
		'..',
		'..',
		ProfilePaths.pluginDirectory,
		ProfilePaths.manifestFile
	);
	return parsePluginManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
}

describe('SpotifyDeckLayout', () => {
	it('should only place actions that the plugin manifest declares', () => {
		const declared = new Set(
			readRealManifest().actions.map((action) => action.uuid)
		);

		for (const placement of placements) {
			expect(declared.has(placement.actionUuid)).toBe(true);
		}
	});

	it('should give every placed action its own ActionID', () => {
		const actionIds = placements.map((placement) => placement.actionId);

		expect(new Set(actionIds).size).toBe(actionIds.length);
	});

	it('should not put two actions on the same key', () => {
		const positions = [
			...SpotifyDeckLayout.keys,
			...SpotifyDeckLayout.folders,
		].map((key) => `${key.column},${key.row}`);

		expect(new Set(positions).size).toBe(positions.length);
	});

	it('should give the folder keys their own ActionID', () => {
		const actionIds = [
			...placements.map((placement) => placement.actionId),
			...builtInActionIds,
		];

		expect(new Set(actionIds).size).toBe(actionIds.length);
	});

	it('should keep the parent folder key free in the folder', () => {
		for (const folder of SpotifyDeckLayout.folders) {
			expect(folder.keys.some((key) => key.column === 0 && key.row === 0)).toBe(
				false
			);
		}
	});

	it('should put the like, search, lyrics and full screen keys in a folder on the fourth key', () => {
		expect(SpotifyDeckLayout.folders).toEqual([
			expect.objectContaining({ column: 3, row: 0 }),
		]);
		expect(
			SpotifyDeckLayout.folders[0]?.keys.map((key) => key.actionUuid)
		).toEqual([
			'com.sonny93.spotify.like',
			'com.sonny93.spotify.open-search',
			'com.sonny93.spotify.toggle-lyrics',
			'com.sonny93.spotify.toggle-fullscreen',
		]);
	});

	it('should keep the same dials inside the folder', () => {
		const describeDials = (
			dials: readonly (typeof SpotifyDeckLayout.encoders)[number][]
		) => dials.map((dial) => [dial.column, dial.actionUuid, dial.settings]);

		expect(describeDials(SpotifyDeckLayout.folders[0]?.encoders ?? [])).toEqual(
			describeDials(SpotifyDeckLayout.encoders)
		);
	});

	it('should put the playlists dial first, then the Spotify, foreground app and picked app volume dials', () => {
		expect(
			SpotifyDeckLayout.encoders.map((encoder) => [
				encoder.column,
				encoder.actionUuid,
				encoder.settings?.target,
			])
		).toEqual([
			[0, 'com.sonny93.spotify.playlists', undefined],
			[1, 'com.sonny93.spotify.volume', 'spotify'],
			[2, 'com.sonny93.spotify.volume', 'focused'],
			[3, 'com.sonny93.spotify.volume', 'app'],
		]);
	});
});
