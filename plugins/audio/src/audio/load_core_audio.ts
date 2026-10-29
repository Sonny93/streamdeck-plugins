import { onceAsync } from 'deck-kit/async/once_async';

import { loadComRuntime } from '../windows/load_com_runtime';
import { bindDefaultDeviceSwitch } from './bind_default_device_switch';
import { bindDeviceListing } from './bind_device_listing';
import { bindEndpointVolume } from './bind_endpoint_volume';
import type { CoreAudio } from './core_audio';
import { CoreAudioConstants } from './core_audio_constants';
import { declareCoreAudioPrototypes } from './declare_core_audio_prototypes';

/** Loads koffi lazily, joins COM and binds the needed Core Audio functions, once. */
export const loadCoreAudio = onceAsync(async (): Promise<CoreAudio> => {
	const runtime = await loadComRuntime();
	const context = {
		runtime,
		prototypes: declareCoreAudioPrototypes(runtime.koffi),
		enumerator: runtime.createInstance(
			CoreAudioConstants.deviceEnumeratorClassId,
			CoreAudioConstants.deviceEnumeratorInterfaceId
		),
	};
	return {
		...bindDeviceListing(context),
		...bindEndpointVolume(context),
		...bindDefaultDeviceSwitch(context),
	};
});
