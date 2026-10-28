import { dirname, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { ProfilePaths } from './profile_paths.ts';
import { SpotifyDeckLayout } from './spotify_deck_layout.ts';
import { buildProfileArchive } from './build_profile_archive.ts';
import { parsePluginManifest } from './parse_plugin_manifest.ts';
import { PluginManifestError } from './plugin_manifest_error.ts';

/** Generates the Spotify Deck profile archive inside the plugin directory of the project, and returns the path it was written to. */
export async function buildProfile(
	options: Readonly<{ rootDirectory: string }>
): Promise<string> {
	const pluginDirectory = join(
		options.rootDirectory,
		ProfilePaths.pluginDirectory
	);
	const manifestPath = join(pluginDirectory, ProfilePaths.manifestFile);
	const manifest = parsePluginManifest(await readManifestJson(manifestPath));
	const outputPath = join(pluginDirectory, ProfilePaths.outputFile);
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		buildProfileArchive({ layout: SpotifyDeckLayout, manifest })
	);
	return outputPath;
}

async function readManifestJson(manifestPath: string): Promise<unknown> {
	try {
		return JSON.parse(await readFile(manifestPath, 'utf8'));
	} catch (cause) {
		throw new PluginManifestError({
			reason: `cannot read ${manifestPath}`,
			cause,
		});
	}
}
