import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { DeviceInfoType } from './device_info_type';
import type { DisplayInfo } from './display_info';
import { DisplaySettingError } from './display_setting_error';

const VALUE_OFFSET = 20;

/** Turns the HDR of a monitor on or off, like the "Use HDR" switch of the Windows display settings. */
export function writeHdrState(
	api: DisplayConfigApi,
	display: DisplayInfo,
	isEnabled: boolean
): void {
	const kind =
		display.hdrApiVersion === 2
			? DeviceInfoType.setHdrState
			: DeviceInfoType.setAdvancedColorState;
	const packet = createDeviceInfoPacket(kind, display.target);
	packet.writeUInt32LE(isEnabled ? 1 : 0, VALUE_OFFSET);
	const result = api.setDeviceInfo(packet);
	if (result !== Win32Constants.errorSuccess) {
		throw new DisplaySettingError({ setting: 'HDR', result });
	}
}
