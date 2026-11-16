import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import type { ClimateHub } from '../../climate/climate_hub';
import type { ClimateView } from '../../climate/climate_view';
import type { UnitState } from '../../daikin/unit_types';
import type { UnitAddressPanel } from '../../unit_address/unit_address_panel';
import type { ClimateActionHandle } from './climate_action_handle';
import type { ClimateActionSettings } from './climate_action_settings';

type ClimateSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<ClimateActionSettings>['onSendToPlugin']>
>[0];

/**
 * Base of the actions of the plugin.
 * It keeps the settings of each visible action, follows the climate hub while one of them is visible,
 * redraws them on every change, and answers the address field of their property inspector.
 */
export abstract class ClimateAction<
	TConfig,
> extends SingletonAction<ClimateActionSettings> {
	private readonly configs = new Map<string, TConfig>();
	private unsubscribe: (() => void) | undefined;

	constructor(
		protected readonly hub: ClimateHub,
		private readonly addressPanel: UnitAddressPanel
	) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<ClimateActionSettings>
	): Promise<void> {
		this.configs.set(ev.action.id, this.readConfig(ev.payload.settings));
		this.unsubscribe ??= this.hub.subscribe(() => {
			void this.redrawAll();
		});
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<ClimateActionSettings>
	): void {
		this.configs.delete(ev.action.id);
		this.addressPanel.forget(ev.action.id);
		if (this.configs.size > 0) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<ClimateActionSettings>
	): Promise<void> {
		this.configs.set(ev.action.id, this.readConfig(ev.payload.settings));
		await this.renderSafely(ev.action);
	}

	override async onSendToPlugin(ev: ClimateSendToPluginEvent): Promise<void> {
		await this.addressPanel.handleMessage(ev.action.id, ev.payload);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<ClimateActionSettings>
	): Promise<void> {
		await this.addressPanel.announce(ev.action.id);
	}

	protected abstract readConfig(rawSettings: unknown): TConfig;

	protected abstract render(
		action: ClimateActionHandle,
		view: ClimateView,
		config: TConfig
	): Promise<void>;

	protected configOf(actionId: string): TConfig {
		return this.configs.get(actionId) ?? this.readConfig({});
	}

	/**
	 * Runs a change on the displayed state of the unit, showing an alert when the unit is not ready or the change fails.
	 * The change is given the state shown now, so a press sends an absolute value computed from what the user sees.
	 */
	protected async runChange(
		action: ClimateActionHandle,
		change: (state: UnitState, config: TConfig) => Promise<void>
	): Promise<void> {
		const { status, state } = this.hub.view;
		if (status !== 'ready' || state === undefined) {
			await this.showAlertSafely(action);
			return;
		}
		try {
			await change(state, this.configOf(action.id));
		} catch (error) {
			streamDeck.logger.warn('Cannot change the air conditioner', error);
			await this.showAlertSafely(action);
		}
	}

	protected async showAlertSafely(action: ClimateActionHandle): Promise<void> {
		try {
			if (action.isKey() || action.isDial()) {
				await action.showAlert();
			}
		} catch (error) {
			streamDeck.logger.warn('Cannot show the alert', error);
		}
	}

	/** Draws every visible action again; it never rejects. */
	protected async redrawAll(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.map((visibleAction) => this.renderSafely(visibleAction))
		);
	}

	private async renderSafely(action: ClimateActionHandle): Promise<void> {
		try {
			await this.render(action, this.hub.view, this.configOf(action.id));
		} catch (error) {
			streamDeck.logger.error('Cannot draw a climate action', error);
		}
	}
}
