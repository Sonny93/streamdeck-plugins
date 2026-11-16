import { buildStripText } from 'deck-kit/strip/build_strip_text';

import type { ClimateView } from '../../climate/climate_view';
import { formatCompactTemperature } from '../shared/format_compact_temperature';
import { formatTemperature } from '../shared/format_temperature';
import { UnitModeNames } from '../shared/unit_mode_names';
import { buildClimateMessageSvg } from '../strip/build_climate_message_svg';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapClimateStripSvg } from '../strip/wrap_climate_strip_svg';

const WIDTH = 200;
const MARGIN = 12;
const RIGHT_EDGE = WIDTH - MARGIN;
const TARGET_CAPTION = 'CONSIGNE';
const DRAFT_CAPTION = 'À VALIDER';
const ROOM_CAPTION = 'PIÈCE';

type TargetBlock = Readonly<{
	value: string;
	caption: string;
	color: string;
	current: string | undefined;
}>;

function describeTarget(
	targetTemperature: number | null,
	draftTemperature: number | undefined
): TargetBlock {
	if (draftTemperature === undefined) {
		return {
			value: formatCompactTemperature(targetTemperature),
			caption: TARGET_CAPTION,
			color: StripPalette.primary,
			current: undefined,
		};
	}
	return {
		value: formatCompactTemperature(draftTemperature),
		caption: DRAFT_CAPTION,
		color: StripPalette.accent,
		current: `Actuel ${formatCompactTemperature(targetTemperature)}`,
	};
}

/**
 * Draws the strip of a "Climate" dial over its slice (`column`) of the background of what the unit does: the room temperature large,
 * the target temperature (a dash when the unit has none), the mode, and the outdoor temperature small; dimmed while the unit is off.
 * While a temperature is chosen and not applied, it takes the place of the target in the accent color under "À VALIDER",
 * with the current target kept in small. While the unit is not ready it shows a message instead.
 */
export function buildClimateDialSvg(
	view: ClimateView,
	draftTemperature?: number,
	column = 0
): string {
	if (view.status !== 'ready' || view.state === undefined) {
		return buildClimateMessageSvg(
			view.status === 'ready' ? 'loading' : view.status,
			column
		);
	}
	const { state, sensors } = view;
	const target = describeTarget(state.targetTemperature, draftTemperature);
	const secondary = StripPalette.secondary;
	const content = [
		buildStripText({
			text: UnitModeNames[state.mode].toUpperCase(),
			x: MARGIN,
			y: 24,
			fontSize: 16,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: `Ext. ${formatTemperature(sensors?.outdoorTemperature)}`,
			x: RIGHT_EDGE,
			y: 24,
			fontSize: 14,
			color: secondary,
			anchor: 'end',
		}),
		buildStripText({
			text: formatCompactTemperature(sensors?.indoorTemperature),
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
			text: ROOM_CAPTION,
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
