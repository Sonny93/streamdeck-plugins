/**
 * Identifiers, vtable slots and flags of the Windows Core Audio COM interfaces used to read and change the volume of each app.
 * Vtable slots count the three `IUnknown` methods first (QueryInterface 0, AddRef 1, Release 2).
 */
export const CoreAudioConstants = {
	mmDeviceEnumeratorClassId: 'BCDE0395-E52F-467C-8E3D-C4579291692E',
	mmDeviceEnumeratorInterfaceId: 'A95664D2-9614-4F35-A746-DE8DB63617E6',
	audioSessionManager2InterfaceId: '77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F',
	audioSessionControl2InterfaceId: 'BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D',
	simpleAudioVolumeInterfaceId: '87CE5498-68D6-44E5-9215-6DA47EF883D8',
	slots: {
		queryInterface: 0,
		release: 2,
		enumAudioEndpoints: 3,
		collectionGetCount: 3,
		collectionItem: 4,
		deviceActivate: 3,
		getSessionEnumerator: 5,
		sessionEnumeratorGetCount: 3,
		sessionEnumeratorGetSession: 4,
		getProcessId: 14,
		setMasterVolume: 3,
		getMasterVolume: 4,
		setMute: 5,
		getMute: 6,
	},
	classContextAll: 0x17,
	renderDataFlow: 0,
	activeDeviceState: 0x1,
	multithreadedApartment: 0x0,
	changedModeResult: 0x80_01_01_06,
	processQueryLimitedInformation: 0x10_00,
	imagePathMaxLength: 1024,
} as const;
