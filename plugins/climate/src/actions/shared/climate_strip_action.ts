import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { IdlePanel } from 'deck-kit/strip/idle_panel';
import { StripDialSurface } from 'deck-kit/strip/strip_dial_surface';
import type { WakeGesture } from 'deck-kit/strip/wake_gesture';

import type { ClimateHub } from '../../climate/climate_hub';
import type { ClimateView } from '../../climate/climate_view';
import type { UnitAddressPanel } from '../../unit_address/unit_address_panel';
import { ClimateAction } from './climate_action';
import type { ClimateActionHandle } from './climate_action_handle';
import type { ClimateActionSettings } from './climate_action_settings';

/**
 * Base of the dials that draw one 200 px picture on their slot of the touch strip.
 * The shared `StripDialSurface` takes care of the idle panel: the dial draws nothing of its own while it shows,
 * and any event on the dial only wakes the dials; the dials that do something override the handlers and start with `consumeWake`.
 */
export abstract class ClimateStripAction<
	TConfig,
> extends ClimateAction<TConfig> {
	private readonly surface: StripDialSurface;

	constructor(
		hub: ClimateHub,
		addressPanel: UnitAddressPanel,
		idle: IdlePanel
	) {
		super(hub, addressPanel);
		this.surface = new StripDialSurface({
			idle,
			redraw: () => {
				void this.redrawAll();
			},
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<ClimateActionSettings>
	): Promise<void> {
		if (ev.action.isDial()) {
			this.surface.appear(ev.action);
		}
		await super.onWillAppear(ev);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<ClimateActionSettings>
	): void {
		this.surface.disappear(ev.action.id);
		super.onWillDisappear(ev);
	}

	override onDialRotate(
		_ev: DialRotateEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake('other');
	}

	override onDialDown(
		_ev: DialDownEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake('press');
	}

	override onDialUp(
		_ev: DialUpEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake('release');
	}

	override onTouchTap(
		_ev: TouchTapEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake('other');
	}

	/** Records an interaction; returns whether the event must be swallowed because it only wakes the dials. */
	protected consumeWake(gesture: WakeGesture): boolean {
		return this.surface.consumeWake(gesture);
	}

	protected abstract buildStripSvg(
		actionId: string,
		view: ClimateView,
		config: TConfig,
		column: number
	): string;

	protected override async render(
		action: ClimateActionHandle,
		view: ClimateView,
		config: TConfig
	): Promise<void> {
		if (!action.isDial()) {
			return;
		}
		await this.surface.draw(action, (column) =>
			this.buildStripSvg(action.id, view, config, column)
		);
	}
}
