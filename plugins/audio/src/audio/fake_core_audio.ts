import type { AudioDevice } from './audio_device';
import { AudioDeviceNotFoundError } from './audio_device_not_found_error';
import type { AudioFlow } from './audio_flow';
import type { AudioSnapshot } from './audio_snapshot';
import type { AudioVolume } from './audio_volume';
import { clampAudioLevel } from './clamp_audio_level';
import type { CoreAudio } from './core_audio';
import { readAudioSnapshot } from './read_audio_snapshot';

const UNMUTED_FULL_VOLUME: AudioVolume = { level: 1, isMuted: false };

/** Test double of the system audio: devices live in memory, and an unknown device fails like the real API. */
export class FakeCoreAudio implements CoreAudio {
	readonly defaultDeviceIds: Record<AudioFlow, string | undefined> = {
		output: undefined,
		input: undefined,
	};
	private readonly devices = new Map<string, AudioDevice>();
	private readonly volumes = new Map<string, AudioVolume>();

	/** Plugs a device in, the first one of a direction becoming its default. */
	plug(device: AudioDevice, volume: AudioVolume = UNMUTED_FULL_VOLUME): void {
		this.devices.set(device.id, device);
		this.volumes.set(device.id, volume);
		this.defaultDeviceIds[device.flow] ??= device.id;
	}

	readonly readSnapshot = (): Promise<AudioSnapshot> => readAudioSnapshot(this);

	readonly listDevices = (flow: AudioFlow): Promise<AudioDevice[]> =>
		Promise.resolve(
			[...this.devices.values()].filter((device) => device.flow === flow)
		);

	readonly readDefaultDeviceId = (
		flow: AudioFlow
	): Promise<string | undefined> =>
		Promise.resolve(this.defaultDeviceIds[flow]);

	readonly readVolume = (deviceId: string): Promise<AudioVolume> => {
		const volume = this.volumes.get(deviceId);
		if (volume === undefined) {
			return Promise.reject(new AudioDeviceNotFoundError(deviceId));
		}
		return Promise.resolve(volume);
	};

	readonly setVolume = async (
		deviceId: string,
		level: number
	): Promise<void> => {
		this.volumes.set(deviceId, { ...(await this.readVolume(deviceId)), level });
	};

	readonly moveVolume = async (
		deviceId: string,
		delta: number
	): Promise<void> => {
		const volume = await this.readVolume(deviceId);
		await this.setVolume(deviceId, clampAudioLevel(volume.level + delta));
		if (volume.isMuted) {
			await this.setMute(deviceId, false);
		}
	};

	readonly setMute = async (
		deviceId: string,
		isMuted: boolean
	): Promise<void> => {
		this.volumes.set(deviceId, {
			...(await this.readVolume(deviceId)),
			isMuted,
		});
	};

	readonly toggleMute = async (deviceId: string): Promise<void> => {
		await this.setMute(deviceId, !(await this.readVolume(deviceId)).isMuted);
	};

	readonly setDefaultDevice = (deviceId: string): Promise<void> => {
		const device = this.devices.get(deviceId);
		if (device === undefined) {
			return Promise.reject(new AudioDeviceNotFoundError(deviceId));
		}
		this.defaultDeviceIds[device.flow] = deviceId;
		return Promise.resolve();
	};
}
