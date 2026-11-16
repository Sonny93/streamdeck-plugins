import { FanRateNames } from '../actions/shared/fan_rate_names';
import { formatCompactTemperature } from '../actions/shared/format_compact_temperature';
import { formatKilowattHours } from '../actions/shared/format_kilowatt_hours';
import { SpecialModeNames } from '../actions/shared/special_mode_names';
import { UnitModeNames } from '../actions/shared/unit_mode_names';
import { buildStripText } from '../actions/strip/build_strip_text';
import { StripPalette } from '../actions/strip/strip_palette';
import { StripPanel } from '../actions/strip/strip_panel';
import type { ClimateView } from '../climate/climate_view';
import type { UnitState } from '../daikin/unit_types';

const MARGIN = 12;
const OFF_TEXT = 'Éteinte';
const COMPRESSOR_RUNNING = 'Compresseur actif';
const COMPRESSOR_IDLE = "Compresseur à l'arrêt";

function slotLeft(slot: number): number {
	return slot * StripPanel.slotWidth + MARGIN;
}

function buildRoomSlot(view: ClimateView): string {
	return [
		buildStripText({
			text: 'PIÈCE',
			x: slotLeft(0),
			y: 24,
			fontSize: 13,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: formatCompactTemperature(view.sensors?.indoorTemperature),
			x: slotLeft(0),
			y: 78,
			fontSize: 54,
			color: StripPalette.primary,
			isBold: true,
		}),
	].join('');
}

function describeMode(state: UnitState): string {
	if (!state.isPowered) {
		return OFF_TEXT;
	}
	const name = UnitModeNames[state.mode];
	return state.targetTemperature === null
		? name
		: `${name} ${formatCompactTemperature(state.targetTemperature)}`;
}

function buildModeSlot(state: UnitState): string {
	const specialModes = state.specialModes
		.map((mode) => SpecialModeNames[mode])
		.join(', ');
	return [
		buildStripText({
			text: describeMode(state),
			x: slotLeft(1),
			y: 56,
			fontSize: 28,
			color: StripPalette.primary,
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
						color: StripPalette.accent,
					}),
				]),
	].join('');
}

function buildOutdoorSlot(view: ClimateView): string {
	const frequency = view.sensors?.compressorFrequency;
	const compressor =
		frequency === null || frequency === undefined
			? undefined
			: frequency > 0
				? COMPRESSOR_RUNNING
				: COMPRESSOR_IDLE;
	return [
		buildStripText({
			text: 'EXTÉRIEUR',
			x: slotLeft(2),
			y: 24,
			fontSize: 13,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: formatCompactTemperature(view.sensors?.outdoorTemperature),
			x: slotLeft(2),
			y: 66,
			fontSize: 40,
			color: StripPalette.primary,
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
						color: StripPalette.secondary,
					}),
				]),
	].join('');
}

function describeEnergy(view: ClimateView): string {
	if (view.energy === undefined) {
		return "Aujourd'hui –";
	}
	const total =
		view.energy.heat.todayKilowattHours + view.energy.cool.todayKilowattHours;
	return `Aujourd'hui ${formatKilowattHours(total)} kWh`;
}

function buildFanAndEnergySlot(view: ClimateView, state: UnitState): string {
	return [
		buildStripText({
			text: `Ventil. ${FanRateNames[state.fanRate]}`,
			x: slotLeft(3),
			y: 44,
			fontSize: 18,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildStripText({
			text: describeEnergy(view),
			x: slotLeft(3),
			y: 78,
			fontSize: 15,
			color: StripPalette.secondary,
		}),
	].join('');
}

/**
 * The texts of the idle dashboard, in the coordinates of the whole 800 by 100 touch strip, one block per slot:
 * the room temperature, the mode and target, the outdoor temperature and compressor, the fan rate and today's energy.
 * Each text sits inside its slot, so none is cut when the panel is split between the four dials.
 */
export function buildDashboardContent(
	view: ClimateView,
	state: UnitState
): string {
	return [
		buildRoomSlot(view),
		buildModeSlot(state),
		buildOutdoorSlot(view),
		buildFanAndEnergySlot(view, state),
	].join('');
}
