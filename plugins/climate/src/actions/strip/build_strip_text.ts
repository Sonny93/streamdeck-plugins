import { escapeXml } from 'deck-kit/text/escape_xml';

const FONT_FAMILY = 'Segoe UI, Arial, sans-serif';

type StripTextOptions = Readonly<{
	text: string;
	x: number;
	y: number;
	fontSize: number;
	color: string;
	anchor?: 'middle' | 'end';
	isBold?: boolean;
}>;

/** One line of text of a strip. */
export function buildStripText(options: StripTextOptions): string {
	const anchor =
		options.anchor === undefined ? '' : ` text-anchor="${options.anchor}"`;
	const weight = options.isBold === true ? ' font-weight="bold"' : '';
	return `<text x="${options.x}" y="${options.y}" fill="${options.color}" font-family="${FONT_FAMILY}" font-size="${options.fontSize}"${weight}${anchor}>${escapeXml(options.text)}</text>`;
}
