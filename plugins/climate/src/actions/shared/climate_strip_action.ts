import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { IdlePanel } from 'deck-kit/strip/idle_panel';
import { resolveStripColumn } from 'deck-kit/strip/resolve_strip_column';
import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';

import type { ClimateHub } from '../../climate/climate_hub';
import type { ClimateView } from '../../climate/climate_view';
import type { UnitAddressPanel } from '../../unit_address/unit_address_panel';
import { ClimateAction } from './climate_action';
import type { ClimateActionHandle } from './climate_action_handle';
import type { ClimateActionSettings } from './climate_action_settings';

const CANVAS_FEEDBACK_KEY = 'canvas';

/**
 * Base of the dials that draw one 200 px picture on their slot of the touch strip, as an SVG data URL.
 * The picture is only sent again when it changed, since the strips are redrawn on every poll of the unit.
 * While the idle dashboard shows, the dial draws nothing of its own, and any interaction on it only wakes the dials;
 * the dials that do something override the handlers and start with `consumeWake`.
 */
export abstract class ClimateStripAction<
	TConfig,
> extends ClimateAction<TConfig> {
	private readonly lastImages = new Map<string, string>();

	constructor(
		hub: ClimateHub,
		addressPanel: UnitAddressPanel,
		protected readonly idle: IdlePanel
	) {
		super(hub, addressPanel);
		idle.onHidden(() => {
			this.lastImages.clear();
			void this.redrawAll();
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<ClimateActionSettings>
	): Promise<void> {
		if (ev.action.isDial()) {
			const dial = ev.action;
			this.idle.attach({
				id: dial.id,
				column: resolveStripColumn(dial.coordinates),
				setFeedback: (feedback) => dial.setFeedback(feedback),
			});
		}
		await super.onWillAppear(ev);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<ClimateActionSettings>
	): void {
		this.lastImages.delete(ev.action.id);
		this.idle.detach(ev.action.id);
		super.onWillDisappear(ev);
	}

	override onDialRotate(
		_ev: DialRotateEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake();
	}

	override onDialDown(
		_ev: DialDownEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake();
	}

	override onDialUp(
		_ev: DialUpEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake();
	}

	override onTouchTap(
		_ev: TouchTapEvent<ClimateActionSettings>
	): Promise<void> | void {
		this.consumeWake();
	}

	/** Records an interaction; returns whether the idle dashboard was showing, i.e. the interaction must do nothing more. */
	protected consumeWake(): boolean {
		return this.idle.wake();
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
		if (!action.isDial() || this.idle.isShowing) {
			return;
		}
		const image = toSvgDataUrl(
			this.buildStripSvg(
				action.id,
				view,
				config,
				resolveStripColumn(action.coordinates)
			)
		);
		if (this.lastImages.get(action.id) === image) {
			return;
		}
		this.lastImages.set(action.id, image);
		await action.setFeedback({ [CANVAS_FEEDBACK_KEY]: image });
	}
}
