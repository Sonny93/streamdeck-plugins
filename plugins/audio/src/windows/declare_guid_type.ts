import type koffiModule from 'koffi';

const GUID_TYPE_NAME = 'GUID';
const GUID_TAIL_LENGTH = 8;

/** Declares the Win32 `GUID` struct for koffi, unless an earlier binding already did. */
export function declareGuidType(koffi: typeof koffiModule): void {
	try {
		koffi.type(GUID_TYPE_NAME);
	} catch {
		koffi.struct(GUID_TYPE_NAME, {
			Data1: 'uint32',
			Data2: 'uint16',
			Data3: 'uint16',
			Data4: koffi.array('uint8', GUID_TAIL_LENGTH),
		});
	}
}
