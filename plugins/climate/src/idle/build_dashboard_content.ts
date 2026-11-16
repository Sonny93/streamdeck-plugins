import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';
import { StripPanel } from 'deck-kit/strip/strip_panel';

import { getFanRateName } from '../actions/shared/fan_rate_name';
import { formatCompactTemperature } from '../actions/shared/format_compact_temperature';
import { formatKilowattHours } from '../actions/shared/format_kilowatt_hours';
import { getSpecialModeName } from '../actions/shared/special_mode_name';
import { getUnitModeName } from '../actions/shared/unit_mode_name';
import { StripPalette } from '../actions/strip/strip_palette';
import type { ClimateView } from '../climate/climate_view';
import type { UnitState } from '../daikin/unit_types';
import { climateMessages } from '../i18n/climate_messages';

const MARGIN = 12;
const { primary, secondary, accent } = StripPalette;

function slotLeft(slot: number): number {
	return slot * StripPanel.slotWidth + MARGIN;
}

function buildRoomSlot(view: ClimateView, language: Language): string {
	return [
		buildStripText({
			text: climateMessages.text('roomCaption', language),
			x: slotLeft(0),
			y: 24,
			fontSize: 13,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: formatCompactTemperature(view.sensors?.indoorTemperature, language),
			x: slotLeft(0),
			y: 78,
			fontSize: 54,
			color: primary,
			isBold: true,
		}),
	].join('');
}

function describeMode(state: UnitState, language: Language): string {
	if (!state.isPowered) {
		return climateMessages.text('dashboardOff', language);
	}
	const name = getUnitModeName(state.mode, language);
	return state.targetTemperature === null
		? name
		: `${name} ${formatCompactTemperature(state.targetTemperature, language)}`;
}

function buildModeSlot(state: UnitState, language: Language): string {
	const specialModes = state.specialModes
		.map((mode) => getSpecialModeName(mode, language))
		.join(', ');
	return [
		buildStripText({
			text: describeMode(state, language),
			x: slotLeft(1),
			y: 56,
			fontSize: 28,
			color: primary,
			isBold: true,
		}),
		...(specialModes === '' || !state.isPowered
			? []
			: [
					buildStripText({
						text: specialModes,
						x: slotLeft(1),
						y: 80,
						fontSize: 14,
						color: accent,
					}),
				]),
	].join('');
}

function buildOutdoorSlot(view: ClimateView, language: Language): string {
	const frequency = view.sensors?.compressorFrequency;
	const compressor =
		frequency === null || frequency === undefined
			? undefined
			: climateMessages.text(
					frequency > 0 ? 'compressorRunning' : 'compressorIdle',
					language
				);
	return [
		buildStripText({
			text: climateMessages.text('outdoorCaptionUpper', language),
			x: slotLeft(2),
			y: 24,
			fontSize: 13,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: formatCompactTemperature(
				view.sensors?.outdoorTemperature,
				language
			),
			x: slotLeft(2),
			y: 66,
			fontSize: 40,
			color: primary,
			isBold: true,
		}),
		...(compressor === undefined
			? []
			: [
					buildStripText({
						text: compressor,
						x: slotLeft(2),
						y: 90,
						fontSize: 14,
						color: secondary,
					}),
				]),
	].join('');
}

function describeEnergy(view: ClimateView, language: Language): string {
	if (view.energy === undefined) {
		return climateMessages.text('dashboardEnergyUnknown', language);
	}
	const total =
		view.energy.heat.todayKilowattHours + view.energy.cool.todayKilowattHours;
	return climateMessages.text('dashboardEnergy', language, {
		value: formatKilowattHours(total, language),
	});
}

function buildFanAndEnergySlot(
	view: ClimateView,
	state: UnitState,
	language: Language
): string {
	const fan = climateMessages.text('fanWithRate', language, {
		rate: getFanRateName(state.fanRate, language),
	});
	return [
		buildStripText({
			text: fan,
			x: slotLeft(3),
			y: 44,
			fontSize: 18,
			color: primary,
			isBold: true,
		}),
		buildStripText({
			text: describeEnergy(view, language),
			x: slotLeft(3),
			y: 78,
			fontSize: 15,
			color: secondary,
		}),
	].join('');
}

/**
 * The texts of the idle dashboard in `language`, in the coordinates of the whole 800 by 100 touch strip, one block per slot:
 * the room temperature, the mode and target, the outdoor temperature and compressor, the fan rate and today's energy.
 * Each text sits inside its slot, so none is cut when the panel is split between the four dials.
 */
export function buildDashboardContent(
	view: ClimateView,
	state: UnitState,
	language: Language
): string {
	return [
		buildRoomSlot(view, language),
		buildModeSlot(state, language),
		buildOutdoorSlot(view, language),
		buildFanAndEnergySlot(view, state, language),
	].join('');
}
