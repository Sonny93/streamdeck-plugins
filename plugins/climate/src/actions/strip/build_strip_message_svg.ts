import type { ClimateStatus } from '../../climate/climate_status';
import { buildStripText } from './build_strip_text';
import { StripPalette } from './strip_palette';
import { wrapStripSvg } from './wrap_strip_svg';

const MESSAGES: Readonly<Record<Exclude<ClimateStatus, 'ready'>, string>> = {
	unconfigured: 'Adresse à définir',
	loading: 'Chargement...',
	unreachable: 'Injoignable',
};

/** The strip shown while the unit is not ready: a message on the neutral background. */
export function buildStripMessageSvg(
	status: Exclude<ClimateStatus, 'ready'>,
	column = 0
): string {
	return wrapStripSvg({
		tone: 'neutral',
		column,
		content: buildStripText({
			text: MESSAGES[status],
			x: 100,
			y: 58,
			fontSize: 22,
			color: StripPalette.primary,
			anchor: 'middle',
		}),
	});
}
