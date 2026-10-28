import { checkHresult } from '../windows/check_hresult';
import { useComObject } from '../windows/use_com_object';
import type { CoreAudio } from './core_audio';
import { CoreAudioConstants } from './core_audio_constants';
import type { CoreAudioContext } from './core_audio_context';

/** Binds the change of the default device, through the undocumented `IPolicyConfig` the Windows sound settings use. */
export function bindDefaultDeviceSwitch(
	context: CoreAudioContext
): Pick<CoreAudio, 'setDefaultDevice'> {
	const { runtime, prototypes } = context;
	return {
		setDefaultDevice: (deviceId) => {
			const policyConfig = runtime.createInstance(
				CoreAudioConstants.policyConfigClassId,
				CoreAudioConstants.policyConfigInterfaceId
			);
			useComObject(runtime, policyConfig, () => {
				const setDefaultEndpoint = runtime.method(
					policyConfig,
					CoreAudioConstants.slots.setDefaultEndpoint,
					prototypes.setDefaultEndpoint
				);
				for (const role of CoreAudioConstants.roles) {
					checkHresult(
						'IPolicyConfig.SetDefaultEndpoint',
						setDefaultEndpoint(deviceId, role)
					);
				}
			});
		},
	};
}
