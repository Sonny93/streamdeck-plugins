import type { AudioApp } from '../audio/audio_app';
import type { AudioMixer } from '../audio/audio_mixer';
import { formatAppDisplayName } from '../audio/format_app_display_name';
import { isSameImageName } from '../audio/is_same_image_name';
import { VolumeControl } from './volume_control';
import type { VolumeReading } from './volume_reading';
import type { VolumeTarget } from './volume_target';

const CAPTIONS: Readonly<Record<VolumeTarget['kind'], string>> = {
	spotify: 'SPOTIFY',
	focused: 'FOCUSED APP',
	app: 'APP',
};
const NO_FOREGROUND_APP_NAME = 'No app';
const NO_PICKED_APP_NAME = 'Pick an app';
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
 * A rotation moves the volume by one step per tick (snapped to the step grid) and unmutes the app; nothing changes for an app that plays no sound.
 */
export class VolumeController {
	constructor(private readonly mixer: AudioMixer) {}

	/** Tells what the dial shows for a target. */
	async read(target: VolumeTarget): Promise<VolumeReading> {
		const { imageName, app } = await this.resolve(target);
		return {
			caption: CAPTIONS[target.kind],
			name: this.nameOf(target, imageName),
			volume: app?.volume,
			isMuted: app?.isMuted ?? false,
		};
	}

	/** Moves the volume by `ticks` steps (negative to lower it); resolves to whether the app plays sound and was changed. */
	async adjust(target: VolumeTarget, ticks: number): Promise<boolean> {
		const { imageName, app } = await this.resolve(target);
		if (imageName === undefined || app === undefined) {
			return false;
		}
		const volume = clampVolume(
			roundToStep(app.volume + ticks * VolumeControl.step)
		);
		return this.mixer.updateApp(imageName, { volume, isMuted: false });
	}

	/** Mutes or unmutes the app; resolves to whether the app plays sound and was changed. */
	async toggleMute(target: VolumeTarget): Promise<boolean> {
		const { imageName, app } = await this.resolve(target);
		if (imageName === undefined || app === undefined) {
			return false;
		}
		return this.mixer.updateApp(imageName, { isMuted: !app.isMuted });
	}

	private async resolve(target: VolumeTarget): Promise<ResolvedTarget> {
		const imageName = await this.resolveImageName(target);
		if (imageName === undefined) {
			return { imageName, app: undefined };
		}
		const apps = await this.mixer.listApps();
		return {
			imageName,
			app: apps.find((candidate) =>
				isSameImageName(candidate.imageName, imageName)
			),
		};
	}

	private async resolveImageName(
		target: VolumeTarget
	): Promise<string | undefined> {
		switch (target.kind) {
			case 'spotify':
				return VolumeControl.spotifyImageName;
			case 'focused':
				return this.mixer.readForegroundImageName();
			case 'app':
				return target.imageName;
		}
	}

	private nameOf(target: VolumeTarget, imageName: string | undefined): string {
		if (imageName !== undefined) {
			return formatAppDisplayName(imageName);
		}
		return target.kind === 'app' ? NO_PICKED_APP_NAME : NO_FOREGROUND_APP_NAME;
	}
}
