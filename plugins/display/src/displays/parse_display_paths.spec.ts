import { describe, expect, it } from 'vitest';

import { parseDisplayPaths } from './parse_display_paths';

const PATH_INFO_SIZE = 72;

function buildRawPath(
	options: Readonly<{ targetId: number; modeIndex: number; rotation: number }>
): Buffer {
	const path = Buffer.alloc(PATH_INFO_SIZE);
	path.writeUInt32LE(0x1234, 0);
	path.writeUInt32LE(3, 8);
	path.writeUInt32LE(options.modeIndex, 12);
	path.writeUInt32LE(0x1234, 20);
	path.writeUInt32LE(options.targetId, 28);
	path.writeUInt32LE(options.rotation, 40);
	return path;
}

describe('parseDisplayPaths', () => {
	it('reads the source, the target and the turn of each path', () => {
		const paths = Buffer.concat([
			buildRawPath({ targetId: 4353, modeIndex: 1, rotation: 1 }),
			buildRawPath({ targetId: 4357, modeIndex: 0xffff_ffff, rotation: 2 }),
		]);

		const parsed = parseDisplayPaths({
			paths,
			pathCount: 2,
			modes: Buffer.alloc(0),
			modeCount: 2,
		});

		expect(parsed).toEqual([
			{
				source: { adapterLow: 0x1234, adapterHigh: 0, id: 3 },
				target: { adapterLow: 0x1234, adapterHigh: 0, id: 4353 },
				sourceModeIndex: 1,
				isTurnedQuarter: false,
			},
			{
				source: { adapterLow: 0x1234, adapterHigh: 0, id: 3 },
				target: { adapterLow: 0x1234, adapterHigh: 0, id: 4357 },
				sourceModeIndex: undefined,
				isTurnedQuarter: true,
			},
		]);
	});
});
