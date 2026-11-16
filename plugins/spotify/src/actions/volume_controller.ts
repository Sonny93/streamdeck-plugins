import type { Language } from 'deck-kit/i18n/language';

import type { AudioApp } from '../audio/audio_app';
import type { AudioMixer } from '../audio/audio_mixer';
import { findForegroundApp } from '../audio/find_foreground_app';
import type { ForegroundApp } from '../audio/foreground_app';
import type { ForegroundReadOptions } from '../audio/foreground_read_options';
import { formatAppDisplayName } from '../audio/format_app_display_name';
import { isSameImageName } from '../audio/is_same_image_name';
import { spotifyMessages } from '../i18n/spotify_messages';
import { VolumeControl } from './volume_control';
import type { VolumeReading } from './volume_reading';
import type { VolumeTarget } from './volume_target';

const CAPTION_KEYS = {
	spotify: 'volumeCaptionSpotify',
	focused: 'volumeCaptionFocused',
	app: 'volumeCaptionApp',
} as const satisfies Readonly<Record<VolumeTarget['kind'], string>>;
const PERCENT = 100;

type ResolvedTarget = Readonly<{
	imageName: string | undefined;
	app: AudioApp | undefined;
}>;

function roundToStep(volume: number): number {
	const steps = Math.round(volume / VolumeControl.step);
	return Math.round(steps * VolumeControl.step * PERCENT) / PERCENT;
}

function clampVolume(volume: number): number {
	return Math.min(1, Math.max(0, volume));
}

/**
 * Reads and changes the volume of what a "Volume" dial targets, through the OS mixer.
 * Reads share one listing while it is in flight, so several dials cost one mixer query; changes always list afresh.
 * A rotation moves the volume by one step per tick (snapped to the step grid) and unmutes the app; nothing changes for an app that plays no sound.
 */
export class VolumeController {
	private sharedListing: Promise<AudioApp[]> | undefined;

	constructor(
		private readonly mixer: AudioMixer,
		private readonly spotifyImageName: string
	) {}

	/** Tells what the dial shows for a target. */
	async read(target: VolumeTarget, language: Language): Promise<VolumeReading> {
		const { imageName, app } = await this.resolve(target);
		return {
			caption: spotifyMessages.text(CAPTION_KEYS[target.kind], language),
			name: this.nameOf({ target, imageName, app, language }),
			volume: app?.volume,
			isMuted: app?.isMuted ?? false,
		};
	}

	/** Moves the volume by `ticks` steps (negative to lower it); resolves to whether the app plays sound and was changed. */
	async adjust(target: VolumeTarget, ticks: number): Promise<boolean> {
		const { app } = await this.resolve(target, { isFresh: true });
		if (app === undefined) {
			return false;
		}
		const volume = clampVolume(
			roundToStep(app.volume + ticks * VolumeControl.step)
		);
		return this.mixer.updateApp(app.imageName, { volume, isMuted: false });
	}

	/** Mutes or unmutes the app; resolves to whether the app plays sound and was changed. */
	async toggleMute(target: VolumeTarget): Promise<boolean> {
		const { app } = await this.resolve(target, { isFresh: true });
		if (app === undefined) {
			return false;
		}
		return this.mixer.updateApp(app.imageName, { isMuted: !app.isMuted });
	}

	private async resolve(
		target: VolumeTarget,
		readOptions: ForegroundReadOptions = {}
	): Promise<ResolvedTarget> {
		const wanted = await this.resolveWanted(target, readOptions);
		if (wanted === undefined) {
			return { imageName: undefined, app: undefined };
		}
		const apps = await this.listApps(readOptions);
		return {
			imageName: wanted.imageName,
			app: findForegroundApp(apps, wanted),
		};
	}

	private listApps(readOptions: ForegroundReadOptions): Promise<AudioApp[]> {
		if (readOptions.isFresh === true) {
			return this.mixer.listApps();
		}
		this.sharedListing ??= this.mixer.listApps().finally(() => {
			this.sharedListing = undefined;
		});
		return this.sharedListing;
	}

	private async resolveWanted(
		target: VolumeTarget,
		readOptions: ForegroundReadOptions
	): Promise<ForegroundApp | undefined> {
		switch (target.kind) {
			case 'spotify':
				return { imageName: this.spotifyImageName };
			case 'focused':
				return this.mixer.readForegroundApp(readOptions);
			case 'app':
				return target.imageName === undefined
					? undefined
					: { imageName: target.imageName };
		}
	}

	private nameOf(
		options: Readonly<{
			target: VolumeTarget;
			imageName: string | undefined;
			app: AudioApp | undefined;
			language: Language;
		}>
	): string {
		const { target, imageName, app, language } = options;
		const isFoundByProcess =
			imageName !== undefined &&
			app !== undefined &&
			!isSameImageName(app.imageName, imageName);
		if (target.kind === 'focused' && isFoundByProcess) {
			return app.displayName;
		}
		if (imageName !== undefined) {
			return formatAppDisplayName(imageName);
		}
		return spotifyMessages.text(
			target.kind === 'app' ? 'pickApp' : 'noApp',
			language
		);
	}
}
