import { describe, expect, it } from 'vitest';

import type { PluginManifest } from './plugin_manifest.ts';
import { SpotifyDeckLayout } from './spotify_deck_layout.ts';
import { buildProfileArchive } from './build_profile_archive.ts';
import { buildProfileEntries } from './build_profile_entries.ts';

const manifest: PluginManifest = {
	name: 'Spotify Deck',
	uuid: 'com.sonny93.spotify',
	version: '0.1.0.0',
	actions: [...SpotifyDeckLayout.keys, ...SpotifyDeckLayout.encoders].map(
		(placement) => ({
			name: placement.actionUuid,
			uuid: placement.actionUuid,
			stateCount: 1,
		})
	),
};

describe('buildProfileEntries', () => {
	it('should lay the archive out like the Stream Deck app does', () => {
		const names = buildProfileEntries({
			layout: SpotifyDeckLayout,
			manifest,
		}).map((entry) => entry.name);
		const profile = 'Profiles/6CF7FFF6-1BF9-4D2B-ADA7-0F84CA45E3F2.sdProfile';
		const defaultPage = `${profile}/Profiles/BA131794-AA36-47E1-8DBA-36955E9F9CF2`;
		const contentPage = `${profile}/Profiles/3D6AF341-25C7-47E9-971A-03292C83BFE7`;

		expect(names).toEqual([
			'package.json',
			'Profiles/',
			`${profile}/`,
			`${profile}/manifest.json`,
			`${profile}/Profiles/`,
			`${defaultPage}/`,
			`${defaultPage}/Images/`,
			`${defaultPage}/manifest.json`,
			`${contentPage}/`,
			`${contentPage}/Images/`,
			`${contentPage}/manifest.json`,
		]);
	});
});

describe('buildProfileArchive', () => {
	it('should give the same bytes on every build', () => {
		const first = buildProfileArchive({ layout: SpotifyDeckLayout, manifest });
		const second = buildProfileArchive({ layout: SpotifyDeckLayout, manifest });

		expect(first.equals(second)).toBe(true);
	});
});
