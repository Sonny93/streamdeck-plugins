import type { Language } from 'deck-kit/i18n/language';

import type { ClimateView } from '../../climate/climate_view';
import { ClimateStripAction } from '../shared/climate_strip_action';
import { buildEnergyDialSvg } from './build_energy_dial_svg';

/** Stream Deck+ dial that shows the energy the air conditioner used today and over the last 7 days. It reacts to nothing, except that an interaction wakes the idle dashboard. */
export class EnergyDialAction extends ClimateStripAction<undefined> {
	override readonly manifestId = 'com.sonny93.climate.energy';

	protected override readConfig(): undefined {
		return undefined;
	}

	protected override buildStripSvg(
		_actionId: string,
		view: ClimateView,
		_config: undefined,
		column: number,
		language: Language
	): string {
		return buildEnergyDialSvg(view, language, column);
	}
}
