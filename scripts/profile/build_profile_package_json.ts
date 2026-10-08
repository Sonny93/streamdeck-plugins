import { ProfileFormat } from './profile_format.ts';
import type { ProfilePackageJson } from './profile_package_json.ts';

/** Builds the root `package.json` of the profile archive, which requires the given plugin. */
export function buildProfilePackageJson(
	options: Readonly<{ pluginUuid: string }>
): ProfilePackageJson {
	return {
		AppVersion: ProfileFormat.appVersion,
		DeviceModel: ProfileFormat.deviceModel,
		DeviceSettings: ProfileFormat.deviceSettings,
		FormatVersion: ProfileFormat.formatVersion,
		OSType: ProfileFormat.osType,
		OSVersion: ProfileFormat.osVersion,
		RequiredPlugins: [options.pluginUuid],
	};
}
