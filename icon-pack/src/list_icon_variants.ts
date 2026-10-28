import { buildKeySvg } from './build_key_svg.ts';
import type { IconVariant } from './icon_variant.ts';
import type { PackIcon } from './pack_icon.ts';

/** Splits an icon into its three images: label on top, label at the bottom, and no label for the native title. */
export function listIconVariants(icon: PackIcon): readonly IconVariant[] {
	const { id, name, tags, glyph, color, label } = icon;
	return [
		{
			fileName: `${id}-label-top.png`,
			name: `${name}, label on top`,
			tags,
			svg: buildKeySvg({
				glyph,
				color,
				label: { text: label, position: 'top' },
			}),
		},
		{
			fileName: `${id}-label-bottom.png`,
			name: `${name}, label at the bottom`,
			tags,
			svg: buildKeySvg({
				glyph,
				color,
				label: { text: label, position: 'bottom' },
			}),
		},
		{
			fileName: `${id}.png`,
			name: `${name}, no label`,
			tags,
			svg: buildKeySvg({ glyph, color, label: undefined }),
		},
	];
}
