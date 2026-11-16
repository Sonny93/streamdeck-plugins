import type { AudioSnapshot } from './audio_snapshot';
import type { AudioVolume } from './audio_volume';
import type { CoreAudio } from './core_audio';

type SnapshotSource = Pick<
	CoreAudio,
	'listDevices' | 'readDefaultDeviceId' | 'readVolume'
>;

async function readVolumeOrUndefined(
	source: SnapshotSource,
	deviceId: string
): Promise<AudioVolume | undefined> {
	try {
		return await source.readVolume(deviceId);
	} catch {
		return undefined;
	}
}

/** Reads the active devices of both directions, the default ones and every volume, one call at a time per device. */
export async function readAudioSnapshot(
	source: SnapshotSource
): Promise<AudioSnapshot> {
	const [outputs, inputs, defaultOutputId, defaultInputId] = await Promise.all([
		source.listDevices('output'),
		source.listDevices('input'),
		source.readDefaultDeviceId('output'),
		source.readDefaultDeviceId('input'),
	]);
	const devices = [...outputs, ...inputs];
	const readVolumes = await Promise.all(
		devices.map((device) => readVolumeOrUndefined(source, device.id))
	);
	const volumes: Record<string, AudioVolume> = {};
	devices.forEach((device, index) => {
		const volume = readVolumes[index];
		if (volume !== undefined) {
			volumes[device.id] = volume;
		}
	});
	return {
		devices,
		defaultDeviceIds: { output: defaultOutputId, input: defaultInputId },
		volumes,
	};
}
