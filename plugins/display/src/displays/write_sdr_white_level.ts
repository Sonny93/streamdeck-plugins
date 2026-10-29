import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { DeviceInfoType } from './device_info_type';
import { DisplaySettingError } from './display_setting_error';
import type { DisplayTarget } from './display_target';

const LEVEL_OFFSET = 20;
const FINAL_VALUE_OFFSET = 24;

/** Sets the white level of SDR content while HDR is on, like the "SDR content brightness" slider of Windows (undocumented call). */
export function writeSdrWhiteLevel(
	api: DisplayConfigApi,
	target: DisplayTarget,
	level: number
): void {
	const packet = createDeviceInfoPacket(
		DeviceInfoType.setSdrWhiteLevel,
		target
	);
	packet.writeUInt32LE(level, LEVEL_OFFSET);
	packet.writeUInt8(1, FINAL_VALUE_OFFSET);
	const result = api.setDeviceInfo(packet);
	if (result !== Win32Constants.errorSuccess) {
		throw new DisplaySettingError({
			setting: 'the SDR content brightness',
			result,
		});
	}
}
