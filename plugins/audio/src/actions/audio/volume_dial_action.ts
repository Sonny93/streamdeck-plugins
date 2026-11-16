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

import type { AudioHub } from '../../audio/audio_hub';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { buildVolumeDialSvg } from '../strip/build_volume_dial_svg';
import { AudioDeviceAction } from './audio_device_action';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';

/**
 * Stream Deck+ dial for the volume of its device, the default output unless another one is picked.
 * Rotate to change the volume (unmuting the device), press the dial or tap the strip to mute or unmute it.
 * The strip is drawn in SVG over the continuous background, and shows the idle panel of the plugin once the Stream Deck is inactive;
 * the first gesture after the panel only wakes the dials, so every event starts with `consumeWake`.
 */
export class VolumeDialAction extends AudioDeviceAction {
	override readonly manifestId = 'com.sonny93.audio.volume';

	protected override readonly fallbackTarget: AudioTarget | undefined = {
		kind: 'default',
		flow: 'output',
	};
	protected override readonly choices: AudioDeviceChoices = {
		event: 'listAudioDevices',
		flows: ['output', 'input'],
		offersDefaults: true,
	};

	private readonly surface: StripDialSurface;

	constructor(hub: AudioHub, languageStore: LanguageStore, idle: IdlePanel) {
		super(hub, languageStore);
		this.surface = new StripDialSurface({
			idle,
			redraw: () => {
				void this.redrawAll();
			},
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		if (ev.action.isDial()) {
			this.surface.appear(ev.action);
		}
		await super.onWillAppear(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.surface.disappear(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onDialRotate(
		ev: DialRotateEvent<AudioDeviceSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.runChange(ev.action, (target) =>
			this.hub.changeVolume(target, ev.payload.ticks)
		);
	}

	override async onDialDown(
		ev: DialDownEvent<AudioDeviceSettings>
	): Promise<void> {
		if (this.surface.consumeWake('press')) {
			return;
		}
		await this.runChange(ev.action, (target) => this.hub.toggleMute(target));
	}

	override onDialUp(_ev: DialUpEvent<AudioDeviceSettings>): void {
		this.surface.consumeWake('release');
	}

	override async onTouchTap(
		ev: TouchTapEvent<AudioDeviceSettings>
	): Promise<void> {
		if (this.surface.consumeWake('other')) {
			return;
		}
		await this.runChange(ev.action, (target) => this.hub.toggleMute(target));
	}

	protected override async render(
		dialAction: WillAppearEvent<AudioDeviceSettings>['action'],
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined,
		language: Language
	): Promise<void> {
		if (!dialAction.isDial() || target === undefined) {
			return;
		}
		await this.surface.draw(dialAction, (column) =>
			buildVolumeDialSvg({ snapshot, target, language, column })
		);
	}
}
