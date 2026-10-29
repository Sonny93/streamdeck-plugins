import type {
	DialDownEvent,
	DialRotateEvent,
	TouchTapEvent,
	WillAppearEvent,
} from '@elgato/streamdeck';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { buildBrightnessDialFeedback } from './build_brightness_dial_feedback';
import { changeMonitorsBrightness } from './change_monitors_brightness';
import { DisplayAction } from './display_action';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';

/**
 * Stream Deck+ dial for the brightness of its monitors, the main one unless others are picked.
 * Rotate to move it by the step of the settings, press the dial to go to the preset brightness, tap the strip to turn the monitors off or on.
 */
export class BrightnessDialAction extends DisplayAction {
	override readonly manifestId = 'com.sonny93.display.brightness';

	protected override readonly offersAll = true;

	override async onDialRotate(
		ev: DialRotateEvent<DisplayActionSettings>
	): Promise<void> {
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
		await this.runChange(ev.action, (monitors, config) =>
			changeMonitorsBrightness(
				monitors,
				config.brightnessControl,
				(monitorId, source) =>
					this.hub.setBrightness(monitorId, source, config.preset)
			)
		);
	}

	override async onTouchTap(
		ev: TouchTapEvent<DisplayActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (monitors, config) =>
			this.hub.toggleScreens(
				monitors.map((monitor) => monitor.id),
				config.offMode
			)
		);
	}

	protected override async render(
		dialAction: WillAppearEvent<DisplayActionSettings>['action'],
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): Promise<void> {
		if (dialAction.isDial()) {
			await dialAction.setFeedback(
				buildBrightnessDialFeedback(monitors, config)
			);
		}
	}
}
