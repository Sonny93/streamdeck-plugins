import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';

import type { ListenHub } from '../../listen/listen_hub';
import type { ListenView } from '../../listen/listen_view';
import { isAudioDevicesRequest } from '../audio/is_audio_devices_request';
import { LanguageInspectorChannel } from '../language/language_inspector_channel';
import { listListenSourceChoices } from './list_listen_source_choices';
import type { ListenActionSettings } from './listen_action_settings';
import type { ListenTarget } from './listen_target';
import { readListenTarget } from './read_listen_target';

const LISTEN_SOURCES_EVENT = 'listListenSources';

type ListenActionHandle = WillAppearEvent<ListenActionSettings>['action'];
type ListenSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<ListenActionSettings>['onSendToPlugin']>
>[0];

async function showAlert(action: ListenActionHandle): Promise<void> {
	if (action.isKey() || action.isDial()) {
		await action.showAlert();
	}
}

/**
 * Base of the actions that play an input in the default output, the input being picked in their settings (hardware inputs only, none by default).
 * Every change of listening goes through the `ListenHub`, which holds the safety checks; without a hub (a system that cannot listen) the actions stay unavailable.
 * It keeps the settings of each visible action, follows the hub, its safety cuts and the language while one of them is visible,
 * and answers the input list of the property inspector.
 */
export abstract class ListenAction extends SingletonAction<ListenActionSettings> {
	private readonly targets = new Map<string, ListenTarget>();
	private unsubscribe: (() => void) | undefined;
	private readonly inspector: LanguageInspectorChannel;

	constructor(
		protected readonly hub: ListenHub | undefined,
		protected readonly languageStore: LanguageStore
	) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
	}

	override async onWillAppear(
		ev: WillAppearEvent<ListenActionSettings>
	): Promise<void> {
		this.keepTarget(ev.action.id, ev.payload.settings);
		this.unsubscribe ??= this.subscribeToChanges();
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<ListenActionSettings>): void {
		this.targets.delete(ev.action.id);
		this.inspector.forget(ev.action.id);
		if (this.targets.size > 0) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<ListenActionSettings>
	): Promise<void> {
		this.keepTarget(ev.action.id, ev.payload.settings);
		await this.renderSafely(ev.action);
	}

	/** Keeps the settings of an action and lowers the level of its input to the ceiling when it is above it, never raising it. */
	private keepTarget(actionId: string, rawSettings: unknown): void {
		const target = readListenTarget(rawSettings);
		this.targets.set(actionId, target);
		if (target.sourceId !== undefined) {
			this.hub?.enforceCeiling(target.sourceId, target.maximumLevel);
		}
	}

	override async onSendToPlugin(ev: ListenSendToPluginEvent): Promise<void> {
		if (await this.inspector.handle(ev.action.id, ev.payload)) {
			return;
		}
		if (!isAudioDevicesRequest(ev.payload, LISTEN_SOURCES_EVENT)) {
			return;
		}
		await this.answerSourceList(ev.action);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<ListenActionSettings>
	): Promise<void> {
		await this.inspector.deliverTo(ev.action.id);
		await this.answerSourceList(ev.action);
	}

	private async answerSourceList(
		action: Readonly<{
			id: string;
			getSettings: () => Promise<ListenActionSettings>;
		}>
	): Promise<void> {
		try {
			const settings = await action.getSettings();
			await this.inspector.replies.reply({
				actionId: action.id,
				event: LISTEN_SOURCES_EVENT,
				payload: {
					event: LISTEN_SOURCES_EVENT,
					items: listListenSourceChoices({
						language: this.languageStore.current,
						sources: this.hub?.current?.sources ?? [],
						pickedValue: settings.device,
					}),
				},
			});
		} catch (error) {
			streamDeck.logger.error('Cannot list the inputs to listen to', error);
		}
	}

	/** Applies a change to the input of an action, showing an alert when there is no hub or input, or the change fails. */
	protected async runChange(
		action: ListenActionHandle,
		change: (
			hub: ListenHub,
			target: ListenTarget & { sourceId: string }
		) => Promise<void> | void
	): Promise<void> {
		const target = this.targets.get(action.id);
		try {
			if (this.hub === undefined || target?.sourceId === undefined) {
				await showAlert(action);
				return;
			}
			await change(this.hub, { ...target, sourceId: target.sourceId });
		} catch (error) {
			streamDeck.logger.warn('Cannot change what is listened to', error);
			await showAlert(action);
		}
	}

	protected abstract render(
		action: ListenActionHandle,
		target: ListenTarget,
		view: ListenView | undefined,
		language: Language
	): Promise<void>;

	/** Called when the language changes, before the visible actions are drawn again; an action that keeps texts of its own updates them here. */
	protected onLanguageChange(): void {}

	private subscribeToChanges(): () => void {
		const stops = [
			this.languageStore.subscribe(() => {
				this.onLanguageChange();
				void this.redrawAll();
			}),
		];
		if (this.hub !== undefined) {
			stops.push(
				this.hub.subscribe(() => {
					void this.redrawAll();
				}),
				this.hub.subscribeToCuts((sourceId) => {
					void this.alertSource(sourceId);
				})
			);
		}
		return () => {
			for (const stop of stops) {
				stop();
			}
		};
	}

	/** Shows the alert on the visible actions of an input whose listening was cut for safety; it never rejects. */
	private async alertSource(sourceId: string): Promise<void> {
		const alerts = this.actions
			.toArray()
			.filter((action) => this.targets.get(action.id)?.sourceId === sourceId)
			.map((action) => showAlert(action).catch(() => undefined));
		await Promise.all(alerts);
	}

	/** Draws every visible action again; it never rejects. */
	protected async redrawAll(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.map((visibleAction) => this.renderSafely(visibleAction))
		);
	}

	private async renderSafely(action: ListenActionHandle): Promise<void> {
		const target = this.targets.get(action.id);
		if (target === undefined) {
			return;
		}
		try {
			await this.render(
				action,
				target,
				this.hub?.current,
				this.languageStore.current
			);
		} catch (error) {
			streamDeck.logger.error('Cannot draw a listen action', error);
		}
	}
}
