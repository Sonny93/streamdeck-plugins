import { join } from 'node:path';

import { IconPackLinkError } from './icon_pack_link_error.ts';
import { linkIconPack } from './link_icon_pack.ts';
import { PackPaths } from './pack_paths.ts';

const appData = process.env['APPDATA'];
if (appData === undefined) {
	throw new IconPackLinkError({ reason: 'APPDATA is not set' });
}
const linkPath = await linkIconPack({
	packDirectory: join(import.meta.dirname, '..', PackPaths.packDirectory),
	iconPacksDirectory: join(appData, ...PackPaths.streamDeckIconPacksDirectory),
});
process.stdout.write(
	`Linked ${linkPath}, restart Stream Deck to load the pack\n`
);
