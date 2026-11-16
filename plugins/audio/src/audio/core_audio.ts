import type { AudioDevice } from './audio_device';
import type { AudioFlow } from './audio_flow';
import type { AudioSnapshot } from './audio_snapshot';
import type { AudioVolume } from './audio_volume';

/** The subset of the system audio needed to list the devices, switch the default one and change their volume. */
export type CoreAudio = Readonly<{
	/** Reads the devices of both directions, the default ones and every volume, with as few system calls as the platform allows. */
	readSnapshot: () => Promise<AudioSnapshot>;
	listDevices: (flow: AudioFlow) => Promise<AudioDevice[]>;
	/** Id of the default device of a direction, `undefined` when there is none. */
	readDefaultDeviceId: (flow: AudioFlow) => Promise<string | undefined>;
	readVolume: (deviceId: string) => Promise<AudioVolume>;
	setVolume: (deviceId: string, level: number) => Promise<void>;
	/** Moves the level by a delta (negative to lower it) within 0 and 1 and unmutes the device, from one reading of it. */
	moveVolume: (deviceId: string, delta: number) => Promise<void>;
	setMute: (deviceId: string, isMuted: boolean) => Promise<void>;
	/** Flips the mute of a device in one step where the platform allows it. */
	toggleMute: (deviceId: string) => Promise<void>;
	/** Makes a device the default one of its direction (on Windows, for every role: multimedia, console and communications). */
	setDefaultDevice: (deviceId: string) => Promise<void>;
}>;
