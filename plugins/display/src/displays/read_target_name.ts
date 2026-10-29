import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { DeviceInfoType } from './device_info_type';
import type { DisplayTarget } from './display_target';
import { readUtf16Field } from './read_utf16_field';

const FRIENDLY_NAME = { offset: 36, length: 64 } as const;
const DEVICE_PATH = { offset: 164, length: 128 } as const;

/** Reads the model name and device path of a monitor (`DISPLAYCONFIG_TARGET_DEVICE_NAME`), `undefined` when Windows refuses. */
export function readTargetName(
	api: DisplayConfigApi,
	target: DisplayTarget
): Readonly<{ model: string; devicePath: string }> | undefined {
	const packet = createDeviceInfoPacket(DeviceInfoType.targetName, target);
	if (api.getDeviceInfo(packet) !== Win32Constants.errorSuccess) {
		return undefined;
	}
	return {
		model: readUtf16Field(packet, FRIENDLY_NAME.offset, FRIENDLY_NAME.length),
		devicePath: readUtf16Field(packet, DEVICE_PATH.offset, DEVICE_PATH.length),
	};
}
