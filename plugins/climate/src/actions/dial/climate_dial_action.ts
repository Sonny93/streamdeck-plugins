import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Scheduler } from 'deck-kit/async/scheduler';
import type { IdlePanel } from 'deck-kit/strip/idle_panel';

import type { ClimateHub } from '../../climate/climate_hub';
import { ClimateTiming } from '../../climate/climate_timing';
import type { ClimateView } from '../../climate/climate_view';
import type { UnitAddressPanel } from '../../unit_address/unit_address_panel';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateStripAction } from '../shared/climate_strip_action';
import { buildClimateDialSvg } from './build_climate_dial_svg';
import type { DialConfig } from './dial_config';
import { DialDrafts } from './dial_drafts';
import { DialTiming } from './dial_timing';
import { readDialConfig } from './read_dial_config';

/**
 * Stream Deck+ dial for the target temperature of the air conditioner.
 * Rotate to choose a temperature, by the step of the settings: nothing is written yet, the strip shows the choice as not applied.
 * Push the dial briefly to apply it, hold it to cancel it; a choice left alone is cancelled after a while.
 */
export class ClimateDialAction extends ClimateStripAction<DialConfig> {
	override readonly manifestId = 'com.sonny93.climate.dial';

	private readonly drafts: DialDrafts;

	constructor(
		hub: ClimateHub,
		addressPanel: UnitAddressPanel,
		idle: IdlePanel,
		schedule: Scheduler
	) {
		super(hub, addressPanel, idle);
		this.drafts = new DialDrafts({
			schedule,
			holdMilliseconds: DialTiming.holdMilliseconds,
			idleMilliseconds: DialTiming.idleMilliseconds,
			onChange: () => {
				void this.redrawAll();
			},
		});
		idle.onShown(() => {
			this.drafts.discardAll();
		});
	}

	override onWillDisappear(
		ev: WillDisappearEvent<ClimateActionSettings>
	): void {
		this.drafts.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onDialRotate(
		ev: DialRotateEvent<ClimateActionSettings>
	): Promise<void> {
		if (this.consumeWake()) {
			return;
		}
		await this.runChange(ev.action, (state, config) => {
			this.drafts.rotate({
				dialId: ev.action.id,
				state,
				ticks: ev.payload.ticks,
				step: config.step,
			});
			return Promise.resolve();
		});
	}

	override onDialDown(ev: DialDownEvent<ClimateActionSettings>): void {
		if (this.consumeWake()) {
			return;
		}
		this.drafts.press(ev.action.id);
	}

	override async onDialUp(
		ev: DialUpEvent<ClimateActionSettings>
	): Promise<void> {
		if (this.consumeWake()) {
			return;
		}
		const targetTemperature = this.drafts.release(ev.action.id);
		if (targetTemperature === undefined) {
			return;
		}
		await this.runChange(ev.action, () =>
			this.hub.requestChange(
				{ targetTemperature },
				ClimateTiming.immediateQuietMilliseconds
			)
		);
	}

	protected override readConfig(rawSettings: unknown): DialConfig {
		return readDialConfig(rawSettings);
	}

	protected override buildStripSvg(
		actionId: string,
		view: ClimateView,
		_config: DialConfig,
		column: number
	): string {
		const draft =
			view.state === undefined
				? undefined
				: this.drafts.read(actionId, view.state.mode);
		return buildClimateDialSvg(view, draft, column);
	}
}
