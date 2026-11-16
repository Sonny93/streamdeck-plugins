import type { Language } from 'deck-kit/i18n/language';
import { resolveStripColumn } from 'deck-kit/strip/resolve_strip_column';
import { StripPanel } from 'deck-kit/strip/strip_panel';

import { buildClimateMessageSvg } from '../actions/strip/build_climate_message_svg';
import { resolveStripTone } from '../actions/strip/resolve_strip_tone';
import { wrapClimateStripSvg } from '../actions/strip/wrap_climate_strip_svg';
import type { ClimateView } from '../climate/climate_view';
import { buildDashboardContent } from './build_dashboard_content';

/**
 * The slice of the idle dashboard that the dial of one column draws: one 800 by 100 design on the continuous background,
 * dimmed while the unit is off, shifted so the column shows its own 200 px. The dashboard is for a ready unit;
 * for another status the slice is the message strip. Texts are in `language`.
 */
export function buildDashboardSvg(
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
	const offset = resolveStripColumn({ column }) * StripPanel.slotWidth;
	return wrapClimateStripSvg({
		tone: resolveStripTone(view),
		column,
		content: `<g transform="translate(-${offset} 0)">${buildDashboardContent(view, view.state, language)}</g>`,
		isDimmed: !view.state.isPowered,
	});
}
