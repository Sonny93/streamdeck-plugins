import type koffiModule from 'koffi';

import type { CoreAudioPrototypes } from './core_audio_prototypes';

/** Declares the koffi prototypes of the Core Audio COM methods; the `GUID` struct must be declared first. */
export function declareCoreAudioPrototypes(
	koffi: typeof koffiModule
): CoreAudioPrototypes {
	koffi.struct('PROPERTYKEY', { fmtid: 'GUID', pid: 'uint32' });
	return {
		enumAudioEndpoints: koffi.proto(
			'int32 __stdcall CoreAudioEnumAudioEndpoints(void *self, int32 flow, uint32 stateMask, _Out_ void **devices)'
		),
		getDefaultAudioEndpoint: koffi.proto(
			'int32 __stdcall CoreAudioGetDefaultAudioEndpoint(void *self, int32 flow, int32 role, _Out_ void **device)'
		),
		getDevice: koffi.proto(
			'int32 __stdcall CoreAudioGetDevice(void *self, str16 id, _Out_ void **device)'
		),
		getCount: koffi.proto(
			'int32 __stdcall CoreAudioGetCount(void *self, _Out_ uint32 *count)'
		),
		item: koffi.proto(
			'int32 __stdcall CoreAudioItem(void *self, uint32 index, _Out_ void **device)'
		),
		activate: koffi.proto(
			'int32 __stdcall CoreAudioActivate(void *self, _In_ GUID *interfaceId, uint32 context, void *parameters, _Out_ void **object)'
		),
		openPropertyStore: koffi.proto(
			'int32 __stdcall CoreAudioOpenPropertyStore(void *self, uint32 access, _Out_ void **store)'
		),
		getId: koffi.proto(
			'int32 __stdcall CoreAudioGetId(void *self, _Out_ void **id)'
		),
		getValue: koffi.proto(
			'int32 __stdcall CoreAudioGetValue(void *self, _In_ PROPERTYKEY *key, void *value)'
		),
		setMasterVolumeLevelScalar: koffi.proto(
			'int32 __stdcall CoreAudioSetMasterVolumeLevelScalar(void *self, float level, void *eventContext)'
		),
		getMasterVolumeLevelScalar: koffi.proto(
			'int32 __stdcall CoreAudioGetMasterVolumeLevelScalar(void *self, _Out_ float *level)'
		),
		setMute: koffi.proto(
			'int32 __stdcall CoreAudioSetMute(void *self, int32 isMuted, void *eventContext)'
		),
		getMute: koffi.proto(
			'int32 __stdcall CoreAudioGetMute(void *self, _Out_ int32 *isMuted)'
		),
		setDefaultEndpoint: koffi.proto(
			'int32 __stdcall CoreAudioSetDefaultEndpoint(void *self, str16 deviceId, int32 role)'
		),
	};
}
