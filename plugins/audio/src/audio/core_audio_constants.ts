/**
 * Identifiers, vtable slots and flags of the Windows Core Audio COM interfaces.
 * Vtable slots count the three `IUnknown` methods first (QueryInterface 0, AddRef 1, Release 2).
 */
export const CoreAudioConstants = {
	deviceEnumeratorClassId: 'BCDE0395-E52F-467C-8E3D-C4579291692E',
	deviceEnumeratorInterfaceId: 'A95664D2-9614-4F35-A746-DE8DB63617E6',
	endpointVolumeInterfaceId: '5CDF2C82-841E-4546-9722-0CF74078229A',
	/** `IPolicyConfig` is undocumented; the Windows sound settings use it to change the default device. */
	policyConfigClassId: '870AF99C-171D-4F9E-AF0D-E63DF40C2BC9',
	policyConfigInterfaceId: 'F8679F50-850A-41CF-9C72-430F290290C8',
	/** `PKEY_Device_FriendlyName`. */
	friendlyNameKey: { set: 'A45C254E-DF1C-4EFD-8020-67D146A850E0', id: 14 },
	slots: {
		enumAudioEndpoints: 3,
		getDefaultAudioEndpoint: 4,
		getDevice: 5,
		collectionGetCount: 3,
		collectionItem: 4,
		deviceActivate: 3,
		deviceOpenPropertyStore: 4,
		deviceGetId: 5,
		propertyStoreGetValue: 5,
		setMasterVolumeLevelScalar: 7,
		getMasterVolumeLevelScalar: 9,
		setMute: 14,
		getMute: 15,
		setDefaultEndpoint: 13,
	},
	dataFlows: { output: 0, input: 1 },
	activeDeviceState: 0x1,
	/** `eConsole`, `eMultimedia` and `eCommunications`. */
	roles: [0, 1, 2],
	consoleRole: 0,
	classContextAll: 0x17,
	readAccess: 0x0,
	propVariantSize: 24,
	propVariantValueOffset: 8,
	wideStringVariantType: 31,
} as const;
