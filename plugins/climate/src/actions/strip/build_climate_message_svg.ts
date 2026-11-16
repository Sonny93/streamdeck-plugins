import { buildStripMessageSvg } from 'deck-kit/strip/build_strip_message_svg';

import type { ClimateStatus } from '../../climate/climate_status';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';

const MESSAGES: Readonly<Record<Exclude<ClimateStatus, 'ready'>, string>> = {
	unconfigured: 'Adresse à définir',
	loading: 'Chargement...',
	unreachable: 'Injoignable',
};

/** The strip shown while the unit is not ready: a message on the neutral background. */
export function buildClimateMessageSvg(
	status: Exclude<ClimateStatus, 'ready'>,
	column = 0
): string {
	return buildStripMessageSvg({
		message: MESSAGES[status],
		color: StripPalette.primary,
		tone: StripTones.neutral,
		column,
	});
}
