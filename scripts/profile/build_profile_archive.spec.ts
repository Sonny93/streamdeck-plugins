import { describe, expect, it } from 'vitest';

import type { PluginManifest } from './plugin_manifest.ts';
import { SpotifyDeckLayout } from './spotify_deck_layout.ts';
import { buildProfileArchive } from './build_profile_archive.ts';
import { buildProfileEntries } from './build_profile_entries.ts';

const manifest: PluginManifest = {
	name: 'Spotify Deck',
	uuid: 'com.sonny93.spotify',
	version: '0.1.0.0',
	actions: [
		...SpotifyDeckLayout.keys,
		...SpotifyDeckLayout.encoders,
		...SpotifyDeckLayout.folders.flatMap((folder) => folder.keys),
	].map((placement) => ({
		name: placement.actionUuid,
		uuid: placement.actionUuid,
		stateCount: 1,
	})),
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
		const folderPage = `${profile}/Profiles/952BE81F-C829-40B3-895C-0052397CB1AC`;

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
			`${folderPage}/`,
			`${folderPage}/Images/`,
			`${folderPage}/manifest.json`,
		]);
	});

	it('should open the folder from the content page and come back from its first key', () => {
		const entries = buildProfileEntries({
			layout: SpotifyDeckLayout,
			manifest,
		});
		const readPage = (suffix: string): unknown => {
			const entry = entries.find((candidate) =>
				candidate.name.endsWith(`${suffix}/manifest.json`)
			);
			return JSON.parse(
				new TextDecoder().decode(entry?.data ?? new Uint8Array()) || 'null'
			);
		};

		expect(readPage('3D6AF341-25C7-47E9-971A-03292C83BFE7')).toMatchObject({
			Controllers: [
				{
					Actions: {
						'3,0': {
							UUID: 'com.elgato.streamdeck.profile.openchild',
							Settings: {
								ProfileUUID: '952be81f-c829-40b3-895c-0052397cb1ac',
							},
						},
					},
				},
				{ Type: 'Encoder' },
			],
		});
		expect(readPage('952BE81F-C829-40B3-895C-0052397CB1AC')).toMatchObject({
			Controllers: [
				{
					Actions: {
						'0,0': { UUID: 'com.elgato.streamdeck.profile.backtoparent' },
						'1,0': { UUID: 'com.sonny93.spotify.like' },
					},
				},
				{ Actions: { '3,0': { Settings: { target: 'app' } } } },
			],
		});
	});

	it('should not list the folder page among the pages of the profile', () => {
		const entries = buildProfileEntries({
			layout: SpotifyDeckLayout,
			manifest,
		});
		const profileManifest = entries.find((entry) =>
			entry.name.endsWith('.sdProfile/manifest.json')
		);

		expect(
			new TextDecoder().decode(profileManifest?.data ?? new Uint8Array())
		).not.toContain('952be81f');
	});
});

describe('buildProfileArchive', () => {
	it('should give the same bytes on every build', () => {
		const first = buildProfileArchive({ layout: SpotifyDeckLayout, manifest });
		const second = buildProfileArchive({ layout: SpotifyDeckLayout, manifest });

		expect(first.equals(second)).toBe(true);
	});
});
