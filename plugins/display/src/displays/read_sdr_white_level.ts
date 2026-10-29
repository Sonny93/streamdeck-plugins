import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { DeviceInfoType } from './device_info_type';
import type { DisplayTarget } from './display_target';

const LEVEL_OFFSET = 20;

/** Reads the white level of SDR content of a monitor (`DISPLAYCONFIG_SDR_WHITE_LEVEL`), `undefined` when Windows refuses. */
export function readSdrWhiteLevel(
	api: DisplayConfigApi,
	target: DisplayTarget
): number | undefined {
	const packet = createDeviceInfoPacket(DeviceInfoType.sdrWhiteLevel, target);
	return api.getDeviceInfo(packet) === Win32Constants.errorSuccess
		? packet.readUInt32LE(LEVEL_OFFSET)
		: undefined;
}
