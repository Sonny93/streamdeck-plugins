import type { DialDownEvent, DialRotateEvent } from '@elgato/streamdeck';

import { ClimateTiming } from '../../climate/climate_timing';
import type { ClimateView } from '../../climate/climate_view';
import { resolveNextFanDirection } from '../fan/resolve_next_fan_direction';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateStripAction } from '../shared/climate_strip_action';
import { buildFanDialSvg } from './build_fan_dial_svg';
import { resolveFanRateByTicks } from './resolve_fan_rate_by_ticks';

/**
 * Stream Deck+ dial for the fan of the air conditioner.
 * Rotate to move the fan rate through the ordered rates, stopping at both ends; several ticks make one write.
 * Push the dial to switch the swing between fixed and both directions. The first interaction after the idle dashboard only wakes the dials.
 */
export class FanDialAction extends ClimateStripAction<undefined> {
	override readonly manifestId = 'com.sonny93.climate.fan-dial';

	override async onDialRotate(
		ev: DialRotateEvent<ClimateActionSettings>
	): Promise<void> {
		if (this.consumeWake()) {
			return;
		}
		await this.runChange(ev.action, (state) => {
			const fanRate = resolveFanRateByTicks(state.fanRate, ev.payload.ticks);
			if (fanRate === state.fanRate) {
				return Promise.resolve();
			}
			return this.hub.requestChange(
				{ fanRate },
				ClimateTiming.fanRateQuietMilliseconds
			);
		});
	}

	override async onDialDown(
		ev: DialDownEvent<ClimateActionSettings>
	): Promise<void> {
		if (this.consumeWake()) {
			return;
		}
		await this.runChange(ev.action, (state) =>
			this.hub.requestChange(
				{ fanDirection: resolveNextFanDirection(state.fanDirection) },
				ClimateTiming.toggleQuietMilliseconds
			)
		);
	}

	protected override readConfig(): undefined {
		return undefined;
	}

	protected override buildStripSvg(
		_actionId: string,
		view: ClimateView,
		_config: undefined,
		column: number
	): string {
		return buildFanDialSvg(view, column);
	}
}
