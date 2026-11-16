import { parseProcessStat } from './parse_process_stat';
import type { ProcFileSystem } from './proc_file_system';

const INIT_PROCESS_ID = 1;
const MAX_ANCESTORS = 5;

/** Lists a process then its parents, closest first, for up to five levels; stops at init or at a process that exited. */
export async function readProcessAncestry(
	options: Readonly<{ procFileSystem: ProcFileSystem; processId: number }>
): Promise<number[]> {
	const ancestry = [options.processId];
	for (let level = 0; level < MAX_ANCESTORS; level += 1) {
		const lastId = ancestry.at(-1) ?? options.processId;
		const stat = await options.procFileSystem.readProcessFile(lastId, 'stat');
		const parentId = stat === undefined ? undefined : parseProcessStat(stat);
		if (
			parentId === undefined ||
			parentId <= INIT_PROCESS_ID ||
			ancestry.includes(parentId)
		) {
			break;
		}
		ancestry.push(parentId);
	}
	return ancestry;
}
