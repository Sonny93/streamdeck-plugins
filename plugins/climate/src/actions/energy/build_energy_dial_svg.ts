import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';

import type { ClimateView } from '../../climate/climate_view';
import type { EnergyConsumption } from '../../daikin/unit_types';
import { climateMessages } from '../../i18n/climate_messages';
import { formatKilowattHours } from '../shared/format_kilowatt_hours';
import { buildClimateMessageSvg } from '../strip/build_climate_message_svg';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapClimateStripSvg } from '../strip/wrap_climate_strip_svg';

const LEFT_COLUMN = 12;
const RIGHT_COLUMN = 112;
const LEFT_UNIT_EDGE = 104;
const RIGHT_UNIT_EDGE = 192;

type Period = Readonly<{
	labelKey: 'energyToday' | 'energySevenDays';
	read: (consumption: EnergyConsumption) => number;
}>;

const TODAY: Period = {
	labelKey: 'energyToday',
	read: (consumption) => consumption.todayKilowattHours,
};
const LAST_SEVEN_DAYS: Period = {
	labelKey: 'energySevenDays',
	read: (consumption) => consumption.lastSevenDaysKilowattHours,
};

function buildColumn(
	view: ClimateView,
	period: Period,
	position: Readonly<{ x: number; unitEdge: number }>,
	language: Language
): string {
	const { x, unitEdge } = position;
	const heat =
		view.energy === undefined ? undefined : period.read(view.energy.heat);
	const cool =
		view.energy === undefined ? undefined : period.read(view.energy.cool);
	const total =
		heat === undefined || cool === undefined ? undefined : heat + cool;
	const { primary, secondary } = StripPalette;
	const heatText = `${climateMessages.text('energyHeat', language)} ${formatKilowattHours(heat, language)}`;
	const coolText = `${climateMessages.text('energyCool', language)} ${formatKilowattHours(cool, language)}`;
	return [
		buildStripText({
			text: climateMessages.text(period.labelKey, language),
			x,
			y: 20,
			fontSize: 12,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: climateMessages.text('energyUnit', language),
			x: unitEdge,
			y: 20,
			fontSize: 11,
			color: secondary,
			anchor: 'end',
		}),
		buildStripText({
			text: formatKilowattHours(total, language),
			x,
			y: 58,
			fontSize: 32,
			color: primary,
			isBold: true,
		}),
		buildStripText({
			text: heatText,
			x,
			y: 76,
			fontSize: 13,
			color: secondary,
		}),
		buildStripText({
			text: coolText,
			x,
			y: 92,
			fontSize: 13,
			color: secondary,
		}),
	].join('');
}

/**
 * Draws the strip of an "Energy" dial over its slice (`column`) of the background: the energy used today in kWh large, and over the last 7 days,
 * each with its heat and cool split. A dash stands for a value not read yet. While the unit is not ready it shows a message instead.
 * Texts are in `language`.
 */
export function buildEnergyDialSvg(
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
	const left = { x: LEFT_COLUMN, unitEdge: LEFT_UNIT_EDGE };
	const right = { x: RIGHT_COLUMN, unitEdge: RIGHT_UNIT_EDGE };
	return wrapClimateStripSvg({
		tone: resolveStripTone(view),
		column,
		content: `${buildColumn(view, TODAY, left, language)}${buildColumn(view, LAST_SEVEN_DAYS, right, language)}`,
	});
}
