import type { CoreAudio } from './core_audio';
import type { AudioTarget } from './audio_target';
import type { AudioSnapshot } from './audio_snapshot';
import { readAudioSnapshot } from './read_audio_snapshot';
import type { AudioHubOptions } from './audio_hub_options';
import { isSameAudioSnapshot } from './is_same_audio_snapshot';
import { AudioDeviceUnavailableError } from './audio_device_unavailable_error';

type AudioSnapshotListener = (snapshot: AudioSnapshot | undefined) => void;

const MIN_LEVEL = 0;
const MAX_LEVEL = 1;
const LEVEL_PRECISION = 100;

function clampLevel(level: number): number {
	const rounded = Math.round(level * LEVEL_PRECISION) / LEVEL_PRECISION;
	return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, rounded));
}

/**
 * Shares the state of the Windows audio devices between every action.
 * It reads the devices at a fixed interval while someone listens, so changes made outside the plugin show up,
 * and reads them again right after each change it makes.
 */
export class AudioHub {
	private readonly listeners = new Set<AudioSnapshotListener>();
	private snapshot: AudioSnapshot | undefined;
	private cancelPoll: (() => void) | undefined;

	constructor(private readonly options: AudioHubOptions) {}

	/** Latest snapshot, `undefined` before the first read or while the devices cannot be read. */
	get current(): AudioSnapshot | undefined {
		return this.snapshot;
	}

	/** Registers a listener and calls it right away; the first listener starts the polling and the last one stops it. */
	subscribe(listener: AudioSnapshotListener): () => void {
		this.listeners.add(listener);
		listener(this.snapshot);
		if (this.cancelPoll === undefined) {
			this.poll();
		}
		return () => {
			this.listeners.delete(listener);
			if (this.listeners.size === 0) {
				this.cancelPoll?.();
				this.cancelPoll = undefined;
			}
		};
	}

	/** Reads the devices now and tells the listeners when something changed. */
	async refresh(): Promise<AudioSnapshot | undefined> {
		try {
			this.publish(readAudioSnapshot(await this.options.loadCoreAudio()));
		} catch (error) {
			this.options.onError(error);
			this.publish(undefined);
		}
		return this.snapshot;
	}

	async setDefaultDevice(target: AudioTarget): Promise<void> {
		await this.change(target, (coreAudio, deviceId) => {
			coreAudio.setDefaultDevice(deviceId);
		});
	}

	async toggleMute(target: AudioTarget): Promise<void> {
		await this.change(target, (coreAudio, deviceId) => {
			coreAudio.setMute(deviceId, !coreAudio.readVolume(deviceId).isMuted);
		});
	}

	/** Moves the volume by a number of steps (negative to lower it), unmuting the device. */
	async changeVolume(target: AudioTarget, steps: number): Promise<void> {
		await this.change(target, (coreAudio, deviceId) => {
			const volume = coreAudio.readVolume(deviceId);
			coreAudio.setVolume(
				deviceId,
				clampLevel(volume.level + steps * this.options.volumeStep)
			);
			if (volume.isMuted) {
				coreAudio.setMute(deviceId, false);
			}
		});
	}

	private async change(
		target: AudioTarget,
		apply: (coreAudio: CoreAudio, deviceId: string) => void
	): Promise<void> {
		const coreAudio = await this.options.loadCoreAudio();
		const deviceId =
			target.kind === 'default'
				? coreAudio.readDefaultDeviceId(target.flow)
				: target.deviceId;
		if (deviceId === undefined) {
			throw new AudioDeviceUnavailableError();
		}
		apply(coreAudio, deviceId);
		await this.refresh();
	}

	private poll(): void {
		void this.refresh();
		this.cancelPoll = this.options.schedule(() => {
			this.poll();
		}, this.options.pollIntervalMilliseconds);
	}

	private publish(snapshot: AudioSnapshot | undefined): void {
		if (isSameAudioSnapshot(this.snapshot, snapshot)) {
			return;
		}
		this.snapshot = snapshot;
		for (const listener of this.listeners) {
			listener(snapshot);
		}
	}
}
