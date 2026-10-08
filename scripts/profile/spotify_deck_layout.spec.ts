import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { ProfilePaths } from './profile_paths.ts';
import { SpotifyDeckLayout } from './spotify_deck_layout.ts';
import { parsePluginManifest } from './parse_plugin_manifest.ts';

const placements = [...SpotifyDeckLayout.keys, ...SpotifyDeckLayout.encoders];

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
		const positions = SpotifyDeckLayout.keys.map(
			(key) => `${key.column},${key.row}`
		);

		expect(new Set(positions).size).toBe(positions.length);
	});

	it('should put the playlists dial on the first dial', () => {
		expect(SpotifyDeckLayout.encoders).toEqual([
			expect.objectContaining({
				column: 0,
				row: 0,
				actionUuid: 'com.sonny93.spotify.playlists',
			}),
		]);
	});
});
