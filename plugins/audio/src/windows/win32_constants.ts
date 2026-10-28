/** Win32 constants used by the kernel32 and cfgmgr32 bindings. */
export const Win32Constants = {
	genericRead: 0x8000_0000,
	genericWrite: 0x4000_0000,
	fileShareReadWrite: 0x0000_0003,
	openExisting: 3,
	noFileFlags: 0,
	invalidHandle: 0xffff_ffff_ffff_ffffn,
	nullHandle: 0n,
	configRetSuccess: 0,
	presentInterfacesOnly: 0,
	utf16BytesPerCharacter: 2,
} as const;
