import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ProfileOnDisk } from './profile_directory.ts';
import type { ProfileDocument } from './profile_document.ts';
import { ReleaseFormats } from './release_formats.ts';
import { removeUnusedPageImages } from './remove_unused_page_images.ts';
import { stringifyProfileJson } from './stringify_profile_json.ts';

async function writePage(
	options: Readonly<{ pageDirectory: string; manifest: unknown }>
): Promise<void> {
	const manifestText = stringifyProfileJson(options.manifest);
	await writeFile(
		path.join(options.pageDirectory, ReleaseFormats.manifestFile),
		manifestText
	);
	await removeUnusedPageImages({
		pageDirectory: options.pageDirectory,
		manifestText,
	});
}

/** Brings a profile folder in line with a filtered document: deletes the page folders it no longer holds and rewrites the manifests that changed. */
export async function writeProfileDirectory(
	options: Readonly<{ original: ProfileOnDisk; filtered: ProfileDocument }>
): Promise<void> {
	const { original, filtered } = options;
	await Promise.all(
		[...original.pageDirectories].map(async ([pageId, pageDirectory]) => {
			const manifest = filtered.pages.get(pageId);
			if (manifest === undefined) {
				await rm(pageDirectory, { recursive: true, force: true });
				return;
			}
			if (manifest !== original.document.pages.get(pageId)) {
				await writePage({ pageDirectory, manifest });
			}
		})
	);
	if (filtered.rootManifest !== original.document.rootManifest) {
		await writeFile(
			path.join(original.sdProfileDirectory, ReleaseFormats.manifestFile),
			stringifyProfileJson(filtered.rootManifest)
		);
	}
}
