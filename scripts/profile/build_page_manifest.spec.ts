import { describe, expect, it } from 'vitest';

import type { PluginManifest } from './plugin_manifest.ts';
import { buildPageManifest } from './build_page_manifest.ts';
import { UnknownActionError } from './unknown_action_error.ts';

const manifest: PluginManifest = {
	name: 'Spotify Deck',
	uuid: 'com.example.deck',
	version: '1.2.3.4',
	actions: [
		{ name: 'Toggle lyrics', uuid: 'com.example.deck.lyrics', stateCount: 2 },
		{ name: 'Playlists', uuid: 'com.example.deck.playlists', stateCount: 1 },
	],
};

describe('buildPageManifest', () => {
	it('should store a key under its column and row, with one empty state per declared state', () => {
		const page = buildPageManifest({
			keys: [
				{
					column: 1,
					row: 0,
					actionUuid: 'com.example.deck.lyrics',
					actionId: 'key-id',
				},
			],
			encoders: [],
			manifest,
		});

		expect(page.Controllers[0]).toEqual({
			Actions: {
				'1,0': {
					ActionID: 'key-id',
					LinkedTitle: true,
					Name: 'Toggle lyrics',
					Plugin: {
						Name: 'Spotify Deck',
						UUID: 'com.example.deck',
						Version: '1.2.3.4',
					},
					Resources: null,
					Settings: {},
					State: 0,
					States: [{}, {}],
					UUID: 'com.example.deck.lyrics',
				},
			},
			Type: 'Keypad',
		});
	});

	it('should store a dial under its index', () => {
		const page = buildPageManifest({
			keys: [],
			encoders: [
				{
					column: 0,
					row: 0,
					actionUuid: 'com.example.deck.playlists',
					actionId: 'dial-id',
				},
			],
			manifest,
		});

		expect(page.Controllers[1]).toEqual({
			Actions: {
				'0,0': expect.objectContaining({
					ActionID: 'dial-id',
					Name: 'Playlists',
					States: [{}],
				}),
			},
			Type: 'Encoder',
		});
	});

	it('should give null actions to a page with nothing placed', () => {
		const page = buildPageManifest({ keys: [], encoders: [], manifest });

		expect(page).toEqual({
			Controllers: [
				{ Actions: null, Type: 'Keypad' },
				{ Actions: null, Type: 'Encoder' },
			],
			Icon: '',
			Name: '',
		});
	});

	it('should fail on an action that the plugin manifest does not declare', () => {
		const build = (): unknown =>
			buildPageManifest({
				keys: [
					{
						column: 0,
						row: 0,
						actionUuid: 'com.example.deck.missing',
						actionId: 'key-id',
					},
				],
				encoders: [],
				manifest,
			});

		expect(build).toThrow(UnknownActionError);
		expect(build).toThrow(/com\.example\.deck\.missing/);
	});
});
