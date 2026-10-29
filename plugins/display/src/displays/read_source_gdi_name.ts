import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { DeviceInfoType } from './device_info_type';
import type { DisplayTarget } from './display_target';
import { readUtf16Field } from './read_utf16_field';

const GDI_NAME = { offset: 20, length: 32 } as const;

/** Reads the GDI device name of a desktop source (`DISPLAYCONFIG_SOURCE_DEVICE_NAME`), `undefined` when Windows refuses. */
export function readSourceGdiName(
	api: DisplayConfigApi,
	source: DisplayTarget
): string | undefined {
	const packet = createDeviceInfoPacket(DeviceInfoType.sourceName, source);
	if (api.getDeviceInfo(packet) !== Win32Constants.errorSuccess) {
		return undefined;
	}
	return readUtf16Field(packet, GDI_NAME.offset, GDI_NAME.length);
}
