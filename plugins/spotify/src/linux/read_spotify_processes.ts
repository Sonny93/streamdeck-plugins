import { parseProcessStat } from './parse_process_stat';
import type { ProcFileSystem } from './proc_file_system';
import type { SpotifyProcess } from './spotify_process';

const SPOTIFY_COMMAND_NAME = 'spotify';

async function readSpotifyProcess(
	procFileSystem: ProcFileSystem,
	processId: number
): Promise<SpotifyProcess | undefined> {
	const command = await procFileSystem.readProcessFile(processId, 'comm');
	if (command?.trim() !== SPOTIFY_COMMAND_NAME) {
		return undefined;
	}
	const stat = await procFileSystem.readProcessFile(processId, 'stat');
	const parentId = stat === undefined ? undefined : parseProcessStat(stat);
	return parentId === undefined ? undefined : { processId, parentId };
}

/** Lists every running process named `spotify`: the main process and the children Chromium starts. */
export async function readSpotifyProcesses(
	procFileSystem: ProcFileSystem
): Promise<SpotifyProcess[]> {
	const processIds = await procFileSystem.listProcessIds();
	const processes = await Promise.all(
		processIds.map((processId) => readSpotifyProcess(procFileSystem, processId))
	);
	return processes.filter((process) => process !== undefined);
}
