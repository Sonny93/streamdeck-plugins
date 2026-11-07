import { buildZip } from 'deck-kit/zip/build_zip';

import { buildProfileEntries } from './build_profile_entries.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ProfileLayout } from './profile_layout.ts';

/** Builds the bytes of the `.streamDeckProfile` for a layout. Same inputs always give the same bytes. */
export function buildProfileArchive(
	options: Readonly<{ layout: ProfileLayout; manifest: PluginManifest }>
): Buffer {
	return buildZip({ entries: buildProfileEntries(options) });
}
