import type { DisplayConfigApi } from '../windows/display_config_api';
import type { DisplayInfo } from './display_info';
import { parseDisplayPaths } from './parse_display_paths';
import { readHdrInfo } from './read_hdr_info';
import { readSdrWhiteLevel } from './read_sdr_white_level';
import { readSourceBounds } from './read_source_bounds';
import { readSourceGdiName } from './read_source_gdi_name';
import { readTargetName } from './read_target_name';

/** Lists the monitors Windows lights, skipping the paths it cannot fully describe. */
export function readDisplayInfos(api: DisplayConfigApi): DisplayInfo[] {
	const config = api.queryActivePaths();
	return parseDisplayPaths(config).flatMap((path): DisplayInfo[] => {
		const sourceBounds =
			path.sourceModeIndex === undefined
				? undefined
				: readSourceBounds(config, path.sourceModeIndex);
		const bounds =
			sourceBounds !== undefined && path.isTurnedQuarter
				? {
						...sourceBounds,
						width: sourceBounds.height,
						height: sourceBounds.width,
					}
				: sourceBounds;
		const name = readTargetName(api, path.target);
		const gdiName = readSourceGdiName(api, path.source);
		if (bounds === undefined || name === undefined || gdiName === undefined) {
			return [];
		}
		const { hdr, version } = readHdrInfo(api, path.target);
		return [
			{
				id: name.devicePath,
				model: name.model === '' ? gdiName : name.model,
				gdiName,
				bounds,
				isPrimary: bounds.left === 0 && bounds.top === 0,
				target: path.target,
				hdr,
				hdrApiVersion: version,
				sdrWhiteLevel: readSdrWhiteLevel(api, path.target),
			},
		];
	});
}
