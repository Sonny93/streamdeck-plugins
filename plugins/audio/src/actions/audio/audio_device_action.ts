import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

import type { AudioHub } from '../../audio/audio_hub';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';
import { isAudioDevicesRequest } from './is_audio_devices_request';
import { listAudioDeviceChoices } from './list_audio_device_choices';
import { readAudioTarget } from './read_audio_target';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];
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
 * It keeps the device of each visible action, follows the audio hub while one of them is visible,
 * redraws them on every change, and answers the device list their property inspector asks for.
 */
export abstract class AudioDeviceAction extends SingletonAction<AudioDeviceSettings> {
	/** Device used while none is picked, `undefined` when the action needs one picked. */
	protected abstract readonly fallbackTarget: AudioTarget | undefined;
	protected abstract readonly choices: AudioDeviceChoices;
	private readonly targets = new Map<string, AudioTarget | undefined>();
	private unsubscribe: (() => void) | undefined;
	private readonly replies =
		new PropertyInspectorReplies<PropertyInspectorPayload>({
			readCurrentActionId: () => streamDeck.ui.action?.id,
			sendToCurrent: (payload) =>
				streamDeck.ui.sendToPropertyInspector(payload),
		});

	constructor(protected readonly hub: AudioHub) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		this.targets.set(
			ev.action.id,
			readAudioTarget(ev.payload.settings, this.fallbackTarget)
		);
		this.unsubscribe ??= this.hub.subscribe(() => {
			void this.renderVisibleActions();
		});
		await this.renderSafely(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.targets.delete(ev.action.id);
		this.replies.forget(ev.action.id);
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
		if (!isAudioDevicesRequest(ev.payload, this.choices.event)) {
			return;
		}
		await this.answerDeviceList(ev.action);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.replies.deliverPending(ev.action.id);
		await this.answerDeviceList(ev.action);
	}

	private async answerDeviceList(
		action: AudioDeviceSettingsReader
	): Promise<void> {
		try {
			const settings = await action.getSettings();
			await this.replies.reply({
				actionId: action.id,
				event: this.choices.event,
				payload: {
					event: this.choices.event,
					items: listAudioDeviceChoices({
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
		snapshot: AudioSnapshot | undefined
	): Promise<void>;

	private async renderVisibleActions(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.map((visibleAction) => this.renderSafely(visibleAction))
		);
	}

	private async renderSafely(action: AudioDeviceActionHandle): Promise<void> {
		try {
			await this.render(action, this.targets.get(action.id), this.hub.current);
		} catch (error) {
			streamDeck.logger.error('Cannot draw an audio device action', error);
		}
	}
}
