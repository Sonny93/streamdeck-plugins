import { join } from 'node:path';

import { PackPaths } from './pack_paths.ts';
import { buildIconPack } from './build_icon_pack.ts';

const packDirectory = join(import.meta.dirname, '..', PackPaths.packDirectory);
await buildIconPack({ packDirectory });
process.stdout.write(`Built ${packDirectory}\n`);
