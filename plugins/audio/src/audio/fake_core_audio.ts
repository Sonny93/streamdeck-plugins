import { ComError } from '../windows/com_error';
import type { AudioDevice } from './audio_device';
import type { AudioFlow } from './audio_flow';
import type { AudioVolume } from './audio_volume';
import type { CoreAudio } from './core_audio';

const NOT_FOUND_RESULT = -2_147_023_728;
const UNMUTED_FULL_VOLUME: AudioVolume = { level: 1, isMuted: false };

/** Test double of Windows Core Audio: devices live in memory, and an unknown device fails like the real API. */
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

	readonly listDevices = (flow: AudioFlow): AudioDevice[] =>
		[...this.devices.values()].filter((device) => device.flow === flow);

	readonly readDefaultDeviceId = (flow: AudioFlow): string | undefined =>
		this.defaultDeviceIds[flow];

	readonly readVolume = (deviceId: string): AudioVolume => {
		const volume = this.volumes.get(deviceId);
		if (volume === undefined) {
			throw new ComError({ call: 'GetDevice', result: NOT_FOUND_RESULT });
		}
		return volume;
	};

	readonly setVolume = (deviceId: string, level: number): void => {
		this.volumes.set(deviceId, { ...this.readVolume(deviceId), level });
	};

	readonly setMute = (deviceId: string, isMuted: boolean): void => {
		this.volumes.set(deviceId, { ...this.readVolume(deviceId), isMuted });
	};

	readonly setDefaultDevice = (deviceId: string): void => {
		const device = this.devices.get(deviceId);
		if (device === undefined) {
			throw new ComError({
				call: 'SetDefaultEndpoint',
				result: NOT_FOUND_RESULT,
			});
		}
		this.defaultDeviceIds[device.flow] = deviceId;
	};
}
