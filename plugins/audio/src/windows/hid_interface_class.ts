import type { Guid } from './guid';

/** `GUID_DEVINTERFACE_HID`: the device interface class of every HID collection. */
export const HidInterfaceClass: Guid = {
	Data1: 0x4d1e_55b2,
	Data2: 0xf16f,
	Data3: 0x11cf,
	Data4: [0x88, 0xcb, 0x00, 0x11, 0x11, 0x00, 0x00, 0x30],
};
