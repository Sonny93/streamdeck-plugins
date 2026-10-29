import type { RawDisplayConfig } from '../windows/raw_display_config';
import type { DisplayPath } from './display_path';

const PATH_INFO_SIZE = 72;
const INVALID_MODE_INDEX = 0xffff_ffff;
const SourceOffsets = {
	adapterLow: 0,
	adapterHigh: 4,
	id: 8,
	modeIndex: 12,
} as const;
const TargetOffsets = {
	adapterLow: 20,
	adapterHigh: 24,
	id: 28,
	rotation: 40,
} as const;
/** `DISPLAYCONFIG_ROTATION` values of a monitor turned a quarter, which shows the desktop source sideways. */
const QUARTER_TURNS: ReadonlySet<number> = new Set([2, 4]);

/** Reads the paths of a raw display configuration (`DISPLAYCONFIG_PATH_INFO` array, 72 bytes each). */
export function parseDisplayPaths(config: RawDisplayConfig): DisplayPath[] {
	return Array.from({ length: config.pathCount }, (_, index) => {
		const offset = index * PATH_INFO_SIZE;
		const modeIndex = config.paths.readUInt32LE(
			offset + SourceOffsets.modeIndex
		);
		return {
			source: {
				adapterLow: config.paths.readUInt32LE(
					offset + SourceOffsets.adapterLow
				),
				adapterHigh: config.paths.readInt32LE(
					offset + SourceOffsets.adapterHigh
				),
				id: config.paths.readUInt32LE(offset + SourceOffsets.id),
			},
			target: {
				adapterLow: config.paths.readUInt32LE(
					offset + TargetOffsets.adapterLow
				),
				adapterHigh: config.paths.readInt32LE(
					offset + TargetOffsets.adapterHigh
				),
				id: config.paths.readUInt32LE(offset + TargetOffsets.id),
			},
			sourceModeIndex:
				modeIndex === INVALID_MODE_INDEX || modeIndex >= config.modeCount
					? undefined
					: modeIndex,
			isTurnedQuarter: QUARTER_TURNS.has(
				config.paths.readUInt32LE(offset + TargetOffsets.rotation)
			),
		};
	});
}
