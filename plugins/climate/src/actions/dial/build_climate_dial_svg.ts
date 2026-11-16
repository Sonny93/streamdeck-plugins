import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';

import type { ClimateView } from '../../climate/climate_view';
import { climateMessages } from '../../i18n/climate_messages';
import { formatCompactTemperature } from '../shared/format_compact_temperature';
import { formatTemperature } from '../shared/format_temperature';
import { getUnitModeName } from '../shared/unit_mode_name';
import { buildClimateMessageSvg } from '../strip/build_climate_message_svg';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapClimateStripSvg } from '../strip/wrap_climate_strip_svg';

const WIDTH = 200;
const MARGIN = 12;
const RIGHT_EDGE = WIDTH - MARGIN;

type TargetBlock = Readonly<{
	value: string;
	caption: string;
	color: string;
	current: string | undefined;
}>;

function describeTarget(
	targetTemperature: number | null,
	draftTemperature: number | undefined,
	language: Language
): TargetBlock {
	if (draftTemperature === undefined) {
		return {
			value: formatCompactTemperature(targetTemperature, language),
			caption: climateMessages.text('targetCaption', language),
			color: StripPalette.primary,
			current: undefined,
		};
	}
	return {
		value: formatCompactTemperature(draftTemperature, language),
		caption: climateMessages.text('draftCaption', language),
		color: StripPalette.accent,
		current: climateMessages.text('currentTarget', language, {
			value: formatCompactTemperature(targetTemperature, language),
		}),
	};
}

/**
 * Draws the strip of a "Climate" dial over its slice (`column`) of the background of what the unit does: the room temperature large,
 * the target temperature (a dash when the unit has none), the mode, and the outdoor temperature small; dimmed while the unit is off.
 * While a temperature is chosen and not applied, it takes the place of the target in the accent color under the "push to set" caption,
 * with the current target kept in small. While the unit is not ready it shows a message instead. Texts are in `language`.
 */
export function buildClimateDialSvg(
	view: ClimateView,
	language: Language,
	draftTemperature?: number,
	column = 0
): string {
	if (view.status !== 'ready' || view.state === undefined) {
		return buildClimateMessageSvg(
			view.status === 'ready' ? 'loading' : view.status,
			language,
			column
		);
	}
	const { state, sensors } = view;
	const target = describeTarget(
		state.targetTemperature,
		draftTemperature,
		language
	);
	const secondary = StripPalette.secondary;
	const content = [
		buildStripText({
			text: getUnitModeName(state.mode, language).toUpperCase(),
			x: MARGIN,
			y: 24,
			fontSize: 16,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: climateMessages.text('outdoorShort', language, {
				value: formatTemperature(sensors?.outdoorTemperature, language),
			}),
			x: RIGHT_EDGE,
			y: 24,
			fontSize: 14,
			color: secondary,
			anchor: 'end',
		}),
		buildStripText({
			text: formatCompactTemperature(sensors?.indoorTemperature, language),
			x: MARGIN,
			y: 68,
			fontSize: 38,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildStripText({
			text: target.value,
			x: RIGHT_EDGE,
			y: 68,
			fontSize: 30,
			color: target.color,
			anchor: 'end',
			isBold: true,
		}),
		buildStripText({
			text: climateMessages.text('roomCaption', language),
			x: MARGIN,
			y: 90,
			fontSize: 12,
			color: secondary,
		}),
		buildStripText({
			text: target.caption,
			x: RIGHT_EDGE,
			y: 90,
			fontSize: 12,
			color: target.color,
			anchor: 'end',
			isBold: true,
		}),
		...(target.current === undefined
			? []
			: [
					buildStripText({
						text: target.current,
						x: RIGHT_EDGE,
						y: 42,
						fontSize: 13,
						color: secondary,
						anchor: 'end',
					}),
				]),
	].join('');
	return wrapClimateStripSvg({
		tone: resolveStripTone(view),
		column,
		content,
		isDimmed: !state.isPowered,
	});
}
