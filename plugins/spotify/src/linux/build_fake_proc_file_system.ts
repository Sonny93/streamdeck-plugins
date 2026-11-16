import type { ProcFileSystem } from './proc_file_system';

type FakeProcess = Readonly<{
	processId: number;
	command: string;
	parentId: number;
	executable?: string;
}>;

/** Test helper: a /proc holding the given processes, with the `comm` and `stat` files a real one has. */
export function buildFakeProcFileSystem(
	processes: readonly FakeProcess[]
): ProcFileSystem {
	return {
		listProcessIds: () =>
			Promise.resolve(processes.map((process) => process.processId)),
		readProcessExecutable: (processId) =>
			Promise.resolve(
				processes.find((process) => process.processId === processId)?.executable
			),
		readProcessFile: (processId, fileName) => {
			const found = processes.find(
				(process) => process.processId === processId
			);
			if (found === undefined) {
				return Promise.resolve(undefined);
			}
			return Promise.resolve(
				fileName === 'comm'
					? `${found.command}\n`
					: `${found.processId} (${found.command}) S ${found.parentId} ${found.processId} 1 0 -1 4194560 1`
			);
		},
	};
}
