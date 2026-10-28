import { acquireOutPointer } from '../windows/acquire_out_pointer';
import { checkHresult } from '../windows/check_hresult';
import type { NativePointer } from '../windows/native_pointer';
import { useComObject } from '../windows/use_com_object';
import type { CoreAudio } from './core_audio';
import { CoreAudioConstants } from './core_audio_constants';
import type { CoreAudioContext } from './core_audio_context';

const { slots } = CoreAudioConstants;
const NO_EVENT_CONTEXT = null;
const NO_ACTIVATION_PARAMETERS = null;

/** Runs `use` with the `IAudioEndpointVolume` of a device, then releases it and the device. */
function useEndpointVolume<TResult>(
	context: CoreAudioContext,
	deviceId: string,
	use: (volume: NativePointer) => TResult
): TResult {
	const { runtime, prototypes, enumerator } = context;
	const device = acquireOutPointer('IMMDeviceEnumerator.GetDevice', (out) =>
		runtime.method(
			enumerator,
			slots.getDevice,
			prototypes.getDevice
		)(deviceId, out)
	);
	return useComObject(runtime, device, () => {
		const volume = acquireOutPointer('IMMDevice.Activate', (out) =>
			runtime.method(device, slots.deviceActivate, prototypes.activate)(
				runtime.guidOf(CoreAudioConstants.endpointVolumeInterfaceId),
				CoreAudioConstants.classContextAll,
				NO_ACTIVATION_PARAMETERS,
				out
			)
		);
		return useComObject(runtime, volume, use);
	});
}

/** Binds the reading and the change of the master volume and mute of a device. */
export function bindEndpointVolume(
	context: CoreAudioContext
): Pick<CoreAudio, 'readVolume' | 'setVolume' | 'setMute'> {
	const { runtime, prototypes } = context;
	return {
		readVolume: (deviceId) =>
			useEndpointVolume(context, deviceId, (volume) => {
				const level = [0];
				const isMuted = [0];
				checkHresult(
					'IAudioEndpointVolume.GetMasterVolumeLevelScalar',
					runtime.method(
						volume,
						slots.getMasterVolumeLevelScalar,
						prototypes.getMasterVolumeLevelScalar
					)(level)
				);
				checkHresult(
					'IAudioEndpointVolume.GetMute',
					runtime.method(volume, slots.getMute, prototypes.getMute)(isMuted)
				);
				return { level: level[0] ?? 0, isMuted: (isMuted[0] ?? 0) !== 0 };
			}),
		setVolume: (deviceId, level) => {
			useEndpointVolume(context, deviceId, (volume) => {
				checkHresult(
					'IAudioEndpointVolume.SetMasterVolumeLevelScalar',
					runtime.method(
						volume,
						slots.setMasterVolumeLevelScalar,
						prototypes.setMasterVolumeLevelScalar
					)(level, NO_EVENT_CONTEXT)
				);
			});
		},
		setMute: (deviceId, isMuted) => {
			useEndpointVolume(context, deviceId, (volume) => {
				checkHresult(
					'IAudioEndpointVolume.SetMute',
					runtime.method(
						volume,
						slots.setMute,
						prototypes.setMute
					)(isMuted ? 1 : 0, NO_EVENT_CONTEXT)
				);
			});
		},
	};
}
