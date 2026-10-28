import { lstat, mkdir, symlink, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { IconPackLinkError } from './icon_pack_link_error.ts';

async function readLinkKind(
	linkPath: string
): Promise<'missing' | 'link' | 'folder'> {
	try {
		return (await lstat(linkPath)).isSymbolicLink() ? 'link' : 'folder';
	} catch (cause) {
		if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
			return 'missing';
		}
		throw new IconPackLinkError({ reason: `cannot read ${linkPath}`, cause });
	}
}

/**
 * Links the pack directory into the icon packs folder of Stream Deck with a junction, like `streamdeck link` does for a plugin,
 * so a rebuild only needs a Stream Deck restart. A previous link is replaced; a real folder in the way is left alone.
 * Returns the path of the link.
 */
export async function linkIconPack(
	options: Readonly<{ packDirectory: string; iconPacksDirectory: string }>
): Promise<string> {
	const linkPath = join(
		options.iconPacksDirectory,
		basename(options.packDirectory)
	);
	const kind = await readLinkKind(linkPath);
	if (kind === 'folder') {
		throw new IconPackLinkError({
			reason: `${linkPath} is a folder, not a link: remove it first`,
		});
	}
	if (kind === 'link') {
		await unlink(linkPath);
	}
	await mkdir(options.iconPacksDirectory, { recursive: true });
	await symlink(options.packDirectory, linkPath, 'junction');
	return linkPath;
}
