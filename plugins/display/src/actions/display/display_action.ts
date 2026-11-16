import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import { LanguagePanel } from 'deck-kit/inspector/language_panel';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

import type { DisplayHub } from '../../displays/display_hub';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';
import { isDataSourceRequest } from './is_data_source_request';
import { listMonitorChoices } from './list_monitor_choices';
import { readDisplayActionConfig } from './read_display_action_config';
import { resolveTargetMonitors } from './resolve_target_monitors';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];
type DisplayActionHandle = WillAppearEvent<DisplayActionSettings>['action'];
type DisplaySendToPluginEvent = Parameters<
	NonNullable<SingletonAction<DisplayActionSettings>['onSendToPlugin']>
>[0];

const MONITORS_DATA_SOURCE = 'listMonitors';

type DisplaySettingsReader = Readonly<{
	id: string;
	getSettings: () => Promise<DisplayActionSettings>;
}>;

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
	private readonly replies =
		new PropertyInspectorReplies<PropertyInspectorPayload>({
			readCurrentActionId: () => streamDeck.ui.action?.id,
			sendToCurrent: (payload) =>
				streamDeck.ui.sendToPropertyInspector(payload),
		});

	private readonly languagePanel: LanguagePanel;

	constructor(
		protected readonly hub: DisplayHub,
		protected readonly languageStore: LanguageStore
	) {
		super();
		this.languagePanel = new LanguagePanel({
			languageStore,
			reply: (actionId, event, payload) =>
				this.replies.reply({ actionId, event, payload }),
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<DisplayActionSettings>
	): Promise<void> {
		this.keepConfig(ev.action.id, ev.payload.settings);
		this.unsubscribe ??= this.subscribeToChanges();
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(
		ev: WillDisappearEvent<DisplayActionSettings>
	): void {
		this.configs.delete(ev.action.id);
		this.replies.forget(ev.action.id);
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
		if (await this.handleLanguageMessage(ev.action.id, ev.payload)) {
			return;
		}
		if (!isDataSourceRequest(ev.payload, MONITORS_DATA_SOURCE)) {
			return;
		}
		await this.answerMonitorList(ev.action);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<DisplayActionSettings>
	): Promise<void> {
		await this.replies.deliverPending(ev.action.id);
		await this.announceLanguage(ev.action.id);
		await this.answerMonitorList(ev.action);
	}

	/** Handles a language message of an inspector; tells whether it was one. It never throws. */
	private async handleLanguageMessage(
		actionId: string,
		payload: unknown
	): Promise<boolean> {
		try {
			return await this.languagePanel.handle(actionId, payload);
		} catch (error) {
			streamDeck.logger.error('Cannot answer the language select', error);
			return true;
		}
	}

	private async announceLanguage(actionId: string): Promise<void> {
		try {
			await this.languagePanel.announce(actionId);
		} catch (error) {
			streamDeck.logger.error('Cannot send the language', error);
		}
	}

	private async answerMonitorList(
		action: DisplaySettingsReader
	): Promise<void> {
		try {
			const settings = await action.getSettings();
			// The hub reads the monitors every few seconds while an action is visible: waiting for a fresh read
			// would make the picker wait for every DDC/CI exchange.
			const snapshot = this.hub.current ?? (await this.hub.refresh());
			await this.replies.reply({
				actionId: action.id,
				event: MONITORS_DATA_SOURCE,
				payload: {
					event: MONITORS_DATA_SOURCE,
					items: listMonitorChoices({
						language: this.languageStore.current,
						snapshot,
						offersAll: this.offersAll,
						pickedValue: settings.monitor,
					}),
				},
			});
		} catch (error) {
			streamDeck.logger.error('Cannot list the monitors', error);
		}
	}

	/**
	 * Applies a change to the monitors of an action, showing an alert when it has none or the change fails.
	 * Right after the plugin starts there is no snapshot yet, and the first read takes seconds of DDC/CI: it waits for it.
	 */
	protected async runChange(
		action: DisplayActionHandle,
		change: (
			monitors: readonly MonitorSnapshot[],
			config: DisplayActionConfig
		) => Promise<void>
	): Promise<void> {
		const config = this.configOf(action.id);
		try {
			const snapshot = this.hub.current ?? (await this.hub.refresh());
			const monitors = resolveTargetMonitors(snapshot, config.target);
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
		config: DisplayActionConfig,
		language: Language
	): Promise<void>;

	private keepConfig(actionId: string, settings: unknown): void {
		this.configs.set(actionId, this.configOfSettings(settings));
	}

	/** Called when the language changes, before the visible actions are drawn again; an action that keeps texts of its own updates them here. */
	protected onLanguageChange(): void {}

	/** Follows the monitors and the language: any change draws the visible actions again. */
	private subscribeToChanges(): () => void {
		const stops = [
			this.hub.subscribe(() => {
				void this.redrawAll();
			}),
			this.languageStore.subscribe(() => {
				this.onLanguageChange();
				void this.redrawAll();
			}),
		];
		return () => {
			for (const stop of stops) {
				stop();
			}
		};
	}

	/** Draws every visible action again; it never rejects. */
	protected async redrawAll(): Promise<void> {
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
				config,
				this.languageStore.current
			);
		} catch (error) {
			streamDeck.logger.error('Cannot draw a display action', error);
		}
	}
}
