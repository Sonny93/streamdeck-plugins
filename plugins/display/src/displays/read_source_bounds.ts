import type { RawDisplayConfig } from '../windows/raw_display_config';
import type { ScreenBounds } from './screen_bounds';

const MODE_INFO_SIZE = 64;
const SOURCE_MODE_TYPE = 1;
const ModeOffsets = {
	type: 0,
	width: 16,
	height: 20,
	left: 28,
	top: 32,
} as const;

/** Reads where a source mode sits on the desktop (`DISPLAYCONFIG_SOURCE_MODE`), `undefined` when the mode is not a source one. */
export function readSourceBounds(
	config: RawDisplayConfig,
	modeIndex: number
): ScreenBounds | undefined {
	const offset = modeIndex * MODE_INFO_SIZE;
	if (
		config.modes.readUInt32LE(offset + ModeOffsets.type) !== SOURCE_MODE_TYPE
	) {
		return undefined;
	}
	return {
		left: config.modes.readInt32LE(offset + ModeOffsets.left),
		top: config.modes.readInt32LE(offset + ModeOffsets.top),
		width: config.modes.readUInt32LE(offset + ModeOffsets.width),
		height: config.modes.readUInt32LE(offset + ModeOffsets.height),
	};
}
