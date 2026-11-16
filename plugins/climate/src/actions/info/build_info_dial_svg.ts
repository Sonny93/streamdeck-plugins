import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';

import type { ClimateView } from '../../climate/climate_view';
import { climateMessages } from '../../i18n/climate_messages';
import { formatTemperature } from '../shared/format_temperature';
import { getSpecialModeName } from '../shared/special_mode_name';
import { buildClimateMessageSvg } from '../strip/build_climate_message_svg';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapClimateStripSvg } from '../strip/wrap_climate_strip_svg';

const MARGIN = 12;

function describeCompressor(
	frequency: number | null | undefined,
	language: Language
): string | undefined {
	if (frequency === null || frequency === undefined) {
		return undefined;
	}
	return climateMessages.text(
		frequency > 0 ? 'compressorRunning' : 'compressorIdle',
		language
	);
}

/**
 * Draws the strip of an "Info" dial over its slice (`column`) of the background: the outdoor temperature large and labelled,
 * whether the compressor runs, and the special modes that are active, if any. While the unit is not ready it shows a message instead.
 * Texts are in `language`.
 */
export function buildInfoDialSvg(
	view: ClimateView,
	language: Language,
	column = 0
): string {
	if (view.status !== 'ready' || view.state === undefined) {
		return buildClimateMessageSvg(
			view.status === 'ready' ? 'loading' : view.status,
			language,
			column
		);
	}
	const compressor = describeCompressor(
		view.sensors?.compressorFrequency,
		language
	);
	const specialModes = view.state.specialModes
		.map((mode) => getSpecialModeName(mode, language))
		.join(', ');
	const lines = [
		buildStripText({
			text: climateMessages.text('outdoorCaption', language),
			x: MARGIN,
			y: 20,
			fontSize: 13,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: formatTemperature(view.sensors?.outdoorTemperature, language),
			x: MARGIN,
			y: 60,
			fontSize: 40,
			color: StripPalette.primary,
			isBold: true,
		}),
		...(compressor === undefined
			? []
			: [
					buildStripText({
						text: compressor,
						x: MARGIN,
						y: 79,
						fontSize: 14,
						color: StripPalette.primary,
					}),
				]),
		...(specialModes === ''
			? []
			: [
					buildStripText({
						text: specialModes,
						x: MARGIN,
						y: 94,
						fontSize: 13,
						color: StripPalette.accent,
					}),
				]),
	];
	return wrapClimateStripSvg({
		tone: resolveStripTone(view),
		column,
		content: lines.join(''),
	});
}
