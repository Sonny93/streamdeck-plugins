import { describe, expect, it } from 'vitest';

import { parsePluginManifest } from './parse_plugin_manifest.ts';
import { PluginManifestError } from './plugin_manifest_error.ts';

describe('parsePluginManifest', () => {
	it('should keep the name, UUID, version and the state count of each action', () => {
		const manifest = parsePluginManifest({
			Name: 'Deck',
			UUID: 'com.example.deck',
			Version: '1.0.0.0',
			Actions: [
				{ Name: 'Lyrics', UUID: 'com.example.deck.lyrics', States: [{}, {}] },
			],
		});

		expect(manifest).toEqual({
			name: 'Deck',
			uuid: 'com.example.deck',
			version: '1.0.0.0',
			actions: [
				{ name: 'Lyrics', uuid: 'com.example.deck.lyrics', stateCount: 2 },
			],
		});
	});

	it('should fail when the actions are missing', () => {
		const parse = (): unknown =>
			parsePluginManifest({ Name: 'Deck', UUID: 'a', Version: '1' });

		expect(parse).toThrow(PluginManifestError);
	});

	it('should fail when an action has no states', () => {
		const parse = (): unknown =>
			parsePluginManifest({
				Name: 'Deck',
				UUID: 'a',
				Version: '1',
				Actions: [{ Name: 'Lyrics', UUID: 'a.lyrics' }],
			});

		expect(parse).toThrow(/a\.lyrics/);
	});
});
