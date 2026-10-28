import type { AudioFlow } from './audio_flow';
import type { AudioDevice } from './audio_device';
import type { AudioVolume } from './audio_volume';

/** The subset of Windows Core Audio needed to list the devices, switch the default one and change their volume. */
export type CoreAudio = Readonly<{
	listDevices: (flow: AudioFlow) => AudioDevice[];
	/** Id of the default device of a direction, `undefined` when there is none. */
	readDefaultDeviceId: (flow: AudioFlow) => string | undefined;
	readVolume: (deviceId: string) => AudioVolume;
	setVolume: (deviceId: string, level: number) => void;
	setMute: (deviceId: string, isMuted: boolean) => void;
	/** Makes a device the default one for every role: multimedia, console and communications. */
	setDefaultDevice: (deviceId: string) => void;
}>;
