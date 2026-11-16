import type { WillDisappearEvent } from '@elgato/streamdeck';

import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import { KeyImageDrawer } from '../keys/key_image_drawer';
import { ClimateAction } from './climate_action';
import type { ClimateActionHandle } from './climate_action_handle';
import type { ClimateActionSettings } from './climate_action_settings';

/** Base of the keys of the plugin: each describes what it shows from the view of the unit and its settings, and is drawn from that. */
export abstract class ClimateKeyAction<TConfig> extends ClimateAction<TConfig> {
	private readonly images = new KeyImageDrawer();

	override onWillDisappear(
		ev: WillDisappearEvent<ClimateActionSettings>
	): void {
		this.images.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	protected abstract describeKey(
		view: ClimateView,
		config: TConfig
	): KeyDescription;

	protected override async render(
		action: ClimateActionHandle,
		view: ClimateView,
		config: TConfig
	): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		const description = this.describeKey(view, config);
		await action.setState(description.state);
		await this.images.draw(action, description);
	}
}
