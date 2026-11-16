import { estimateTextWidth } from '../text/estimate_text_width';

const TEXT_ELEMENT =
	/<text x="([\d.]+)" y="([\d.]+)"[^>]* font-size="([\d.]+)"( font-weight="bold")?( text-anchor="(?:middle|end)")?>([^<]*)<\/text>/gu;
const ENTITIES: Readonly<Record<string, string>> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&apos;': "'",
};

export type MeasuredText = Readonly<{
	text: string;
	left: number;
	right: number;
	y: number;
}>;

/** Lists the texts of a strip picture with the horizontal span they cover, estimated from the Arial metrics, to check that they fit and do not overlap. */
export function measureStripTexts(svg: string): readonly MeasuredText[] {
	return [...svg.matchAll(TEXT_ELEMENT)].map((match) => {
		const [, x = '0', y = '0', fontSize = '0', bold, anchor, escaped = ''] =
			match;
		const text = escaped.replaceAll(
			/&(?:amp|lt|gt|quot|apos);/gu,
			(entity) => ENTITIES[entity] ?? entity
		);
		const width = estimateTextWidth({
			text,
			fontSize: Number(fontSize),
			isBold: bold !== undefined,
		});
		const origin = Number(x);
		if (anchor?.includes('end') === true) {
			return { text, left: origin - width, right: origin, y: Number(y) };
		}
		if (anchor?.includes('middle') === true) {
			return {
				text,
				left: origin - width / 2,
				right: origin + width / 2,
				y: Number(y),
			};
		}
		return { text, left: origin, right: origin + width, y: Number(y) };
	});
}
