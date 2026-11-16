import type { ClimateView } from '../../climate/climate_view';
import type { EnergyConsumption } from '../../daikin/unit_types';
import { formatKilowattHours } from '../shared/format_kilowatt_hours';
import { buildStripMessageSvg } from '../strip/build_strip_message_svg';
import { buildStripText } from '../strip/build_strip_text';
import { resolveStripTone } from '../strip/resolve_strip_tone';
import { StripPalette } from '../strip/strip_palette';
import { wrapStripSvg } from '../strip/wrap_strip_svg';

const LEFT_COLUMN = 12;
const RIGHT_COLUMN = 112;
const LEFT_UNIT_EDGE = 104;
const RIGHT_UNIT_EDGE = 192;
const UNIT = 'kWh';
const HEAT_CAPTION = 'chaud';
const COOL_CAPTION = 'froid';

type Period = Readonly<{
	label: string;
	read: (consumption: EnergyConsumption) => number;
}>;

const TODAY: Period = {
	label: "Aujourd'hui",
	read: (consumption) => consumption.todayKilowattHours,
};
const LAST_SEVEN_DAYS: Period = {
	label: '7 jours',
	read: (consumption) => consumption.lastSevenDaysKilowattHours,
};

function buildColumn(
	view: ClimateView,
	period: Period,
	x: number,
	unitEdge: number
): string {
	const heat =
		view.energy === undefined ? undefined : period.read(view.energy.heat);
	const cool =
		view.energy === undefined ? undefined : period.read(view.energy.cool);
	const total =
		heat === undefined || cool === undefined ? undefined : heat + cool;
	const { primary, secondary } = StripPalette;
	return [
		buildStripText({
			text: period.label,
			x,
			y: 20,
			fontSize: 12,
			color: secondary,
			isBold: true,
		}),
		buildStripText({
			text: UNIT,
			x: unitEdge,
			y: 20,
			fontSize: 11,
			color: secondary,
			anchor: 'end',
		}),
		buildStripText({
			text: formatKilowattHours(total),
			x,
			y: 58,
			fontSize: 32,
			color: primary,
			isBold: true,
		}),
		buildStripText({
			text: `${HEAT_CAPTION} ${formatKilowattHours(heat)}`,
			x,
			y: 76,
			fontSize: 13,
			color: secondary,
		}),
		buildStripText({
			text: `${COOL_CAPTION} ${formatKilowattHours(cool)}`,
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
 */
export function buildEnergyDialSvg(view: ClimateView, column = 0): string {
	if (view.status !== 'ready' || view.state === undefined) {
		return buildStripMessageSvg(
			view.status === 'ready' ? 'loading' : view.status,
			column
		);
	}
	return wrapStripSvg({
		tone: resolveStripTone(view),
		column,
		content: `${buildColumn(view, TODAY, LEFT_COLUMN, LEFT_UNIT_EDGE)}${buildColumn(view, LAST_SEVEN_DAYS, RIGHT_COLUMN, RIGHT_UNIT_EDGE)}`,
	});
}
