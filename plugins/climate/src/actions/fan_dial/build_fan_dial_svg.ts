import type { ClimateView } from '../../climate/climate_view';
import { FanRateNames } from '../shared/fan_rate_names';
import { buildStripMessageSvg } from '../strip/build_strip_message_svg';
import { buildStripText } from '../strip/build_strip_text';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapStripSvg } from '../strip/wrap_strip_svg';

const MARGIN = 12;
const CAPTION = 'VENTILATION';
const SWINGING = 'Balayage';
const FIXED = 'Volet fixe';

/**
 * Draws the strip of a "Ventilation" dial over its slice (`column`) of the background: the displayed fan rate large under its caption,
 * and whether the louver swings, small; dimmed while the unit is off. While the unit is not ready it shows a message instead.
 */
export function buildFanDialSvg(view: ClimateView, column = 0): string {
	if (view.status !== 'ready' || view.state === undefined) {
		return buildStripMessageSvg(
			view.status === 'ready' ? 'loading' : view.status,
			column
		);
	}
	const { state } = view;
	const content = [
		buildStripText({
			text: CAPTION,
			x: MARGIN,
			y: 22,
			fontSize: 13,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: FanRateNames[state.fanRate],
			x: MARGIN,
			y: 64,
			fontSize: 40,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildStripText({
			text: state.fanDirection === 'fixed' ? FIXED : SWINGING,
			x: MARGIN,
			y: 90,
			fontSize: 14,
			color: StripPalette.secondary,
		}),
	].join('');
	return wrapStripSvg({
		tone: resolveStripTone(view),
		column,
		content,
		isDimmed: !state.isPowered,
	});
}
