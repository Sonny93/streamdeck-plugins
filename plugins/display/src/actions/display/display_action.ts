import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import type { DisplayHub } from '../../displays/display_hub';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';
import { isDataSourceRequest } from './is_data_source_request';
import { listMonitorChoices } from './list_monitor_choices';
import { readDisplayActionConfig } from './read_display_action_config';
import { resolveTargetMonitors } from './resolve_target_monitors';

type DisplayActionHandle = WillAppearEvent<DisplayActionSettings>['action'];
type DisplaySendToPluginEvent = Parameters<
	NonNullable<SingletonAction<DisplayActionSettings>['onSendToPlugin']>
>[0];

const MONITORS_DATA_SOURCE = 'listMonitors';

async function showAlert(action: DisplayActionHandle): Promise<void> {
	if (action.isKey() || action.isDial()) {
		await action.showAlert();
	}
}

/**
 * Base of the actions that work on monitors picked in their settings.
 * It keeps the settings of each visible action, follows the display hub while one of them is visible,
 * redraws them on every change, and answers the monitor list their property inspector asks for.
 */
export abstract class DisplayAction extends SingletonAction<DisplayActionSettings> {
	/** Whether the action can work on all monitors at once. */
	protected abstract readonly offersAll: boolean;
	private readonly configs = new Map<string, DisplayActionConfig>();
	private unsubscribe: (() => void) | undefined;

	constructor(protected readonly hub: DisplayHub) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<DisplayActionSettings>
	): Promise<void> {
		this.keepConfig(ev.action.id, ev.payload.settings);
		this.unsubscribe ??= this.hub.subscribe(() => {
			void this.renderVisibleActions();
		});
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<DisplayActionSettings>
	): void {
		this.configs.delete(ev.action.id);
		if (this.configs.size > 0) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<DisplayActionSettings>
	): Promise<void> {
		this.keepConfig(ev.action.id, ev.payload.settings);
		await this.renderSafely(ev.action);
	}

	override async onSendToPlugin(ev: DisplaySendToPluginEvent): Promise<void> {
		if (!isDataSourceRequest(ev.payload, MONITORS_DATA_SOURCE)) {
			return;
		}
		try {
			const settings = await ev.action.getSettings();
			// The hub reads the monitors every few seconds while an action is visible: waiting for a fresh read
			// would make the picker wait for every DDC/CI exchange.
			const snapshot = this.hub.current ?? (await this.hub.refresh());
			await streamDeck.ui.sendToPropertyInspector({
				event: MONITORS_DATA_SOURCE,
				items: listMonitorChoices({
					snapshot,
					offersAll: this.offersAll,
					pickedValue: settings.monitor,
				}),
			});
		} catch (error) {
			streamDeck.logger.error('Cannot list the monitors', error);
		}
	}

	/** Applies a change to the monitors of an action, showing an alert when it has none or the change fails. */
	protected async runChange(
		action: DisplayActionHandle,
		change: (
			monitors: readonly MonitorSnapshot[],
			config: DisplayActionConfig
		) => Promise<void>
	): Promise<void> {
		const config = this.configOf(action.id);
		const monitors = resolveTargetMonitors(this.hub.current, config.target);
		try {
			if (monitors.length === 0) {
				await showAlert(action);
				return;
			}
			await change(monitors, config);
		} catch (error) {
			streamDeck.logger.warn('Cannot change the monitors', error);
			await showAlert(action);
		}
	}

	protected configOf(actionId: string): DisplayActionConfig {
		return this.configs.get(actionId) ?? this.configOfSettings({});
	}

	protected configOfSettings(settings: unknown): DisplayActionConfig {
		return readDisplayActionConfig(settings, { offersAll: this.offersAll });
	}

	protected abstract render(
		action: DisplayActionHandle,
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): Promise<void>;

	private keepConfig(actionId: string, settings: unknown): void {
		this.configs.set(actionId, this.configOfSettings(settings));
	}

	private async renderVisibleActions(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.map((visibleAction) => this.renderSafely(visibleAction))
		);
	}

	private async renderSafely(action: DisplayActionHandle): Promise<void> {
		const config = this.configOf(action.id);
		try {
			await this.render(
				action,
				resolveTargetMonitors(this.hub.current, config.target),
				config
			);
		} catch (error) {
			streamDeck.logger.error('Cannot draw a display action', error);
		}
	}
}
