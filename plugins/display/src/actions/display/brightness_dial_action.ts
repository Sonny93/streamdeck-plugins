import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import type { IdlePanel } from 'deck-kit/strip/idle_panel';
import { StripDialSurface } from 'deck-kit/strip/strip_dial_surface';

import type { DisplayHub } from '../../displays/display_hub';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { buildBrightnessDialSvg } from '../strip/build_brightness_dial_svg';
import { changeMonitorsBrightness } from './change_monitors_brightness';
import { DisplayAction } from './display_action';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';
import { resolveOffMode } from './resolve_off_mode';

/**
 * Stream Deck+ dial for the brightness of its monitors, the main one unless others are picked.
 * Rotate to move it by the step of the settings, press the dial to go to the preset brightness, tap the strip to turn the monitors off or on.
 * The strip is drawn in SVG over the continuous background, and shows the idle panel of the plugin once the Stream Deck is inactive;
 * the first gesture after the panel only wakes the dials, so every event starts with `consumeWake`.
 */
export class BrightnessDialAction extends DisplayAction {
	override readonly manifestId = 'com.sonny93.display.brightness';

	protected override readonly offersAll = true;

	private readonly surface: StripDialSurface;

	constructor(hub: DisplayHub, languageStore: LanguageStore, idle: IdlePanel) {
		super(hub, languageStore);
		this.surface = new StripDialSurface({
			idle,
			redraw: () => {
				void this.redrawAll();
			},
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<DisplayActionSettings>
	): Promise<void> {
		if (ev.action.isDial()) {
			this.surface.appear(ev.action);
		}
		await super.onWillAppear(ev);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<DisplayActionSettings>
	): void {
		this.surface.disappear(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onDialRotate(
		ev: DialRotateEvent<DisplayActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.runChange(ev.action, (monitors, config) =>
			changeMonitorsBrightness(
				monitors,
				config.brightnessControl,
				(monitorId, source) =>
					this.hub.changeBrightness(
						monitorId,
						source,
						ev.payload.ticks * config.step
					)
			)
		);
	}

	override async onDialDown(
		ev: DialDownEvent<DisplayActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('press')) {
			return;
		}
		await this.runChange(ev.action, (monitors, config) =>
			changeMonitorsBrightness(
				monitors,
				config.brightnessControl,
				(monitorId, source) =>
					this.hub.setBrightness(monitorId, source, config.preset)
			)
		);
	}

	override onDialUp(_ev: DialUpEvent<DisplayActionSettings>): void {
		this.surface.consumeWake('release');
	}

	override async onTouchTap(
		ev: TouchTapEvent<DisplayActionSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.runChange(ev.action, (monitors, config) =>
			this.hub.toggleScreens(
				monitors.map((monitor) => monitor.id),
				resolveOffMode(config.offMode, monitors)
			)
		);
	}

	protected override async render(
		dialAction: WillAppearEvent<DisplayActionSettings>['action'],
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig,
		language: Language
	): Promise<void> {
		if (!dialAction.isDial()) {
			return;
		}
		await this.surface.draw(dialAction, (column) =>
			buildBrightnessDialSvg(monitors, config, language, column)
		);
	}
}
