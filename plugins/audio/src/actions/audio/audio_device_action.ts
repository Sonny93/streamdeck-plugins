import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';

import type { AudioHub } from '../../audio/audio_hub';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { LanguageInspectorChannel } from '../language/language_inspector_channel';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';
import { isAudioDevicesRequest } from './is_audio_devices_request';
import { listAudioDeviceChoices } from './list_audio_device_choices';
import { readAudioTarget } from './read_audio_target';

type AudioDeviceActionHandle = WillAppearEvent<AudioDeviceSettings>['action'];
type AudioSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<AudioDeviceSettings>['onSendToPlugin']>
>[0];

type AudioDeviceSettingsReader = Readonly<{
	id: string;
	getSettings: () => Promise<AudioDeviceSettings>;
}>;

async function showAlert(action: AudioDeviceActionHandle): Promise<void> {
	if (action.isKey() || action.isDial()) {
		await action.showAlert();
	}
}

/**
 * Base of the actions that work on an audio device picked in their settings.
 * It keeps the device of each visible action, follows the audio hub and the language while one of them is visible,
 * redraws them on every change, answers the device list their property inspector asks for, and the language select they share.
 */
export abstract class AudioDeviceAction extends SingletonAction<AudioDeviceSettings> {
	/** Device used while none is picked, `undefined` when the action needs one picked. */
	protected abstract readonly fallbackTarget: AudioTarget | undefined;
	protected abstract readonly choices: AudioDeviceChoices;
	private readonly targets = new Map<string, AudioTarget | undefined>();
	private unsubscribe: (() => void) | undefined;
	private readonly inspector: LanguageInspectorChannel;

	constructor(
		protected readonly hub: AudioHub,
		protected readonly languageStore: LanguageStore
	) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
	}

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		this.targets.set(
			ev.action.id,
			readAudioTarget(ev.payload.settings, this.fallbackTarget)
		);
		this.unsubscribe ??= this.subscribeToChanges();
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.targets.delete(ev.action.id);
		this.inspector.forget(ev.action.id);
		if (this.targets.size > 0) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<AudioDeviceSettings>
	): Promise<void> {
		this.targets.set(
			ev.action.id,
			readAudioTarget(ev.payload.settings, this.fallbackTarget)
		);
		await this.renderSafely(ev.action);
	}

	override async onSendToPlugin(ev: AudioSendToPluginEvent): Promise<void> {
		if (await this.inspector.handle(ev.action.id, ev.payload)) {
			return;
		}
		if (!isAudioDevicesRequest(ev.payload, this.choices.event)) {
			return;
		}
		await this.answerDeviceList(ev.action);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.inspector.deliverTo(ev.action.id);
		await this.answerDeviceList(ev.action);
	}

	private async answerDeviceList(
		action: AudioDeviceSettingsReader
	): Promise<void> {
		try {
			const settings = await action.getSettings();
			await this.inspector.replies.reply({
				actionId: action.id,
				event: this.choices.event,
				payload: {
					event: this.choices.event,
					items: listAudioDeviceChoices({
						language: this.languageStore.current,
						snapshot: await this.hub.refresh(),
						choices: this.choices,
						pickedValue: settings.device,
					}),
				},
			});
		} catch (error) {
			streamDeck.logger.error('Cannot list the audio devices', error);
		}
	}

	/** Applies a change to the device of an action, showing an alert when it has none or the change fails. */
	protected async runChange(
		action: AudioDeviceActionHandle,
		change: (target: AudioTarget) => Promise<void>
	): Promise<void> {
		const target = this.targets.get(action.id);
		try {
			if (target === undefined) {
				await showAlert(action);
				return;
			}
			await change(target);
		} catch (error) {
			streamDeck.logger.warn('Cannot change the audio device', error);
			await showAlert(action);
		}
	}

	protected abstract render(
		action: AudioDeviceActionHandle,
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined,
		language: Language
	): Promise<void>;

	/** Called when the language changes, before the visible actions are drawn again; an action that keeps texts of its own updates them here. */
	protected onLanguageChange(): void {}

	/** Follows the audio devices and the language: any change draws the visible actions again. */
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

	private async renderSafely(action: AudioDeviceActionHandle): Promise<void> {
		try {
			await this.render(
				action,
				this.targets.get(action.id),
				this.hub.current,
				this.languageStore.current
			);
		} catch (error) {
			streamDeck.logger.error('Cannot draw an audio device action', error);
		}
	}
}
