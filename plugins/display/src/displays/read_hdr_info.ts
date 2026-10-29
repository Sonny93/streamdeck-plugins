import type { DisplayConfigApi } from '../windows/display_config_api';
import { Win32Constants } from '../windows/win32_constants';
import { createDeviceInfoPacket } from './create_device_info_packet';
import { decodeHdrInfo } from './decode_hdr_info';
import { DeviceInfoType } from './device_info_type';
import type { DisplayTarget } from './display_target';
import type { HdrApiVersion } from './hdr_api_version';
import type { HdrInfo } from './hdr_info';

const FLAGS_OFFSET = 20;
const NO_HDR: HdrInfo = { isSupported: false, isEnabled: false };

/** Reads the HDR of a monitor with the newest API Windows answers, and tells which one it was. */
export function readHdrInfo(
	api: DisplayConfigApi,
	target: DisplayTarget
): Readonly<{ hdr: HdrInfo; version: HdrApiVersion }> {
	const packet2 = createDeviceInfoPacket(
		DeviceInfoType.advancedColorInfo2,
		target
	);
	if (api.getDeviceInfo(packet2) === Win32Constants.errorSuccess) {
		return {
			hdr: decodeHdrInfo(packet2.readUInt32LE(FLAGS_OFFSET), 2),
			version: 2,
		};
	}
	const packet1 = createDeviceInfoPacket(
		DeviceInfoType.advancedColorInfo,
		target
	);
	if (api.getDeviceInfo(packet1) === Win32Constants.errorSuccess) {
		return {
			hdr: decodeHdrInfo(packet1.readUInt32LE(FLAGS_OFFSET), 1),
			version: 1,
		};
	}
	return { hdr: NO_HDR, version: 1 };
}
