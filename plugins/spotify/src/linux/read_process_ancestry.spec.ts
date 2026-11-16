import { describe, expect, it } from 'vitest';

import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { readProcessAncestry } from './read_process_ancestry';

describe('readProcessAncestry', () => {
	it('should list the process then its parents, closest first', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 30, command: 'renderer', parentId: 20 },
			{ processId: 20, command: 'browser', parentId: 10 },
			{ processId: 10, command: 'shell', parentId: 1 },
		]);

		expect(
			await readProcessAncestry({ procFileSystem, processId: 30 })
		).toStrictEqual([30, 20, 10]);
	});

	it('should stop at a parent that is gone', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 30, command: 'renderer', parentId: 20 },
		]);

		expect(
			await readProcessAncestry({ procFileSystem, processId: 30 })
		).toStrictEqual([30, 20]);
	});

	it('should stop after five levels', async () => {
		const procFileSystem = buildFakeProcFileSystem(
			Array.from({ length: 12 }, (_, index) => ({
				processId: 100 + index,
				command: 'p',
				parentId: 101 + index,
			}))
		);

		expect(
			await readProcessAncestry({ procFileSystem, processId: 100 })
		).toHaveLength(6);
	});
});
