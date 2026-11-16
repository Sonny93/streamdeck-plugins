import type { Language } from 'deck-kit/i18n/language';
import { buildStripMessageSvg } from 'deck-kit/strip/build_strip_message_svg';

import type { ClimateStatus } from '../../climate/climate_status';
import { climateMessages } from '../../i18n/climate_messages';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';

const MESSAGE_KEYS = {
	unconfigured: 'statusUnconfigured',
	loading: 'statusLoading',
	unreachable: 'statusUnreachable',
} as const satisfies Record<Exclude<ClimateStatus, 'ready'>, string>;

/** The strip shown while the unit is not ready: a message on the neutral background. */
export function buildClimateMessageSvg(
	status: Exclude<ClimateStatus, 'ready'>,
	language: Language,
	column = 0
): string {
	return buildStripMessageSvg({
		message: climateMessages.text(MESSAGE_KEYS[status], language),
		color: StripPalette.primary,
		tone: StripTones.neutral,
		column,
	});
}
