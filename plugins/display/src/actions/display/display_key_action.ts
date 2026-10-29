import type {
	DidReceiveSettingsEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { DrawnKeyImages } from '../keys/drawn_key_images';
import type { KeyAppearance } from '../keys/key_appearance';
import type { KeyStateValue } from '../keys/key_state_value';
import { readKeyLabel } from '../keys/read_key_label';
import { DisplayAction } from './display_action';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';

/**
 * Base of the display keys: each shows a state and draws its label, typed in its settings or the default one of the action,
 * in the color of its icon.
 */
export abstract class DisplayKeyAction extends DisplayAction {
	private readonly images = new DrawnKeyImages();

	override async onWillAppear(
		ev: WillAppearEvent<DisplayActionSettings>
	): Promise<void> {
		this.keepLabel(ev.action.id, ev.payload.settings);
		await super.onWillAppear(ev);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<DisplayActionSettings>
	): Promise<void> {
		this.keepLabel(ev.action.id, ev.payload.settings);
		await super.onDidReceiveSettings(ev);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<DisplayActionSettings>
	): void {
		this.images.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	/** Label drawn while none is typed in the settings, `undefined` to keep the manifest images. */
	protected abstract defaultLabel(
		config: DisplayActionConfig
	): string | undefined;

	protected abstract resolveKeyState(
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): KeyStateValue;

	protected abstract appearanceOf(state: KeyStateValue): KeyAppearance;

	protected override async render(
		keyAction: WillAppearEvent<DisplayActionSettings>['action'],
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): Promise<void> {
		if (!keyAction.isKey()) {
			return;
		}
		const state = this.resolveKeyState(monitors, config);
		await keyAction.setState(state);
		await this.images.draw(keyAction, this.appearanceOf(state));
	}

	private keepLabel(actionId: string, settings: unknown): void {
		this.images.setLabel(
			actionId,
			readKeyLabel(settings, this.defaultLabel(this.configOfSettings(settings)))
		);
	}
}
