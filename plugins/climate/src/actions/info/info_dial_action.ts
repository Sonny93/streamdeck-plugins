import type { ClimateView } from '../../climate/climate_view';
import { ClimateStripAction } from '../shared/climate_strip_action';
import { buildInfoDialSvg } from './build_info_dial_svg';

/** Stream Deck+ dial that shows the outdoor temperature, whether the compressor runs and the active special modes. It reacts to nothing, except that an interaction wakes the idle dashboard. */
export class InfoDialAction extends ClimateStripAction<undefined> {
	override readonly manifestId = 'com.sonny93.climate.info';

	protected override readConfig(): undefined {
		return undefined;
	}

	protected override buildStripSvg(
		_actionId: string,
		view: ClimateView,
		_config: undefined,
		column: number
	): string {
		return buildInfoDialSvg(view, column);
	}
}
