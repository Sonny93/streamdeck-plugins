import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';

import { PackPaths } from './pack_paths.ts';
import { PackIcons } from './pack_icons.ts';
import { renderPng } from './render_png.ts';
import { IconPalette } from './icon_palette.ts';
import { folderGlyph } from './folder_glyph.ts';
import { buildKeySvg } from './build_key_svg.ts';
import { listIconVariants } from './list_icon_variants.ts';

const KEY_WIDTH = 144;
const PACK_ICON_WIDTH = 56;

/** Writes the PNG of every icon, the `icons.json` index and the pack image into the pack directory, next to its manifest. */
export async function buildIconPack(
	options: Readonly<{ packDirectory: string }>
): Promise<void> {
	const iconsDirectory = join(options.packDirectory, PackPaths.iconsDirectory);
	await rm(iconsDirectory, { recursive: true, force: true });
	await mkdir(iconsDirectory, { recursive: true });
	const variants = PackIcons.flatMap(listIconVariants);
	await Promise.all(
		variants.map((variant) =>
			writeFile(
				join(iconsDirectory, variant.fileName),
				renderPng({ svg: variant.svg, width: KEY_WIDTH })
			)
		)
	);
	const index = variants.map(({ fileName, name, tags }) => ({
		path: fileName,
		name,
		tags,
	}));
	await writeFile(
		join(options.packDirectory, PackPaths.iconsIndexFile),
		`${JSON.stringify(index, undefined, '\t')}\n`
	);
	await writeFile(
		join(options.packDirectory, PackPaths.packIconFile),
		renderPng({
			svg: buildKeySvg({
				glyph: (color) => folderGlyph(color),
				color: IconPalette.neutral,
				label: undefined,
			}),
			width: PACK_ICON_WIDTH,
		})
	);
}
