import fs from 'node:fs/promises';

import type { ProcFileSystem } from './proc_file_system';

const PROC_DIRECTORY = '/proc';
const DECIMAL_NAME = /^\d+$/;

/** Reads /proc; a process that exits during the scan reads as `undefined` instead of failing. */
export const nodeProcFileSystem: ProcFileSystem = {
	listProcessIds: async () =>
		(await fs.readdir(PROC_DIRECTORY))
			.filter((name) => DECIMAL_NAME.test(name))
			.map(Number),
	readProcessFile: async (processId, fileName) => {
		try {
			return await fs.readFile(
				`${PROC_DIRECTORY}/${processId}/${fileName}`,
				'utf8'
			);
		} catch {
			return undefined;
		}
	},
	readProcessExecutable: async (processId) => {
		try {
			return await fs.readlink(`${PROC_DIRECTORY}/${processId}/exe`);
		} catch {
			return undefined;
		}
	},
};
