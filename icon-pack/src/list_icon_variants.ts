import { buildKeySvg } from './build_key_svg.ts';
import type { IconVariant } from './icon_variant.ts';
import type { PackIcon } from './pack_icon.ts';

const LANGUAGES = [
	{ code: 'en', name: 'English' },
	{ code: 'fr', name: 'French' },
] as const;

const LABEL_POSITIONS = [
	{ position: 'top', fileSuffix: 'top', description: 'label on top' },
	{
		position: 'bottom',
		fileSuffix: 'bottom',
		description: 'label at the bottom',
	},
] as const;

/** Splits an icon into its images: one without label for the native title, then a label on top and at the bottom for each language. */
export function listIconVariants(icon: PackIcon): readonly IconVariant[] {
	const { id, name, tags, glyph, color, label } = icon;
	const unlabeled: IconVariant = {
		fileName: `${id}.png`,
		name: `${name}, no label`,
		tags,
		svg: buildKeySvg({ glyph, color, label: undefined }),
	};
	const labeled = LANGUAGES.flatMap((language) =>
		LABEL_POSITIONS.map(
			({ position, fileSuffix, description }): IconVariant => ({
				fileName: `${id}-label-${fileSuffix}-${language.code}.png`,
				name: `${name}, ${description} (${language.name})`,
				tags,
				svg: buildKeySvg({
					glyph,
					color,
					label: { text: label[language.code], position },
				}),
			})
		)
	);
	return [unlabeled, ...labeled];
}
