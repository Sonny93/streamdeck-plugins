import { estimateTextWidth } from '../text/estimate_text_width';
import { fitText } from '../text/fit_text';

/** Share of its budget a text may fill: the width is estimated from Arial, and the font the host draws with can be wider. */
const WIDTH_SAFETY_FACTOR = 0.88;

/**
 * Shortens a text drawn on a strip so that it fits a width budget, ended with an ellipsis when it had to be cut.
 * The estimate is kept 12 % under the budget, so a font wider than Arial does not push the text out of its slot.
 */
export function fitStripText(
	options: Readonly<{
		text: string;
		fontSize: number;
		isBold: boolean;
		maxWidth: number;
	}>
): string {
	const budget = options.maxWidth * WIDTH_SAFETY_FACTOR;
	return fitText({
		text: options.text,
		fits: (candidate) =>
			estimateTextWidth({
				text: candidate,
				fontSize: options.fontSize,
				isBold: options.isBold,
			}) <= budget,
	});
}
