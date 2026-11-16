import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';

import type { ClimateView } from '../../climate/climate_view';
import { climateMessages } from '../../i18n/climate_messages';
import { getFanRateName } from '../shared/fan_rate_name';
import { buildClimateMessageSvg } from '../strip/build_climate_message_svg';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapClimateStripSvg } from '../strip/wrap_climate_strip_svg';

const MARGIN = 12;

/**
 * Draws the strip of a "Fan" dial over its slice (`column`) of the background: the displayed fan rate large under its caption,
 * and whether the louver swings, small; dimmed while the unit is off. While the unit is not ready it shows a message instead.
 * Texts are in `language`.
 */
export function buildFanDialSvg(
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
	const { state } = view;
	const swing = climateMessages.text(
		state.fanDirection === 'fixed' ? 'swingFixed' : 'swingOn',
		language
	);
	const content = [
		buildStripText({
			text: climateMessages.text('fanDialCaption', language),
			x: MARGIN,
			y: 22,
			fontSize: 13,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: getFanRateName(state.fanRate, language),
			x: MARGIN,
			y: 64,
			fontSize: 40,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildStripText({
			text: swing,
			x: MARGIN,
			y: 90,
			fontSize: 14,
			color: StripPalette.secondary,
		}),
	].join('');
	return wrapClimateStripSvg({
		tone: resolveStripTone(view),
		column,
		content,
		isDimmed: !state.isPowered,
	});
}
