import { nodeProcFileSystem } from './node_proc_file_system';
import type { ProcFileSystem } from './proc_file_system';
import { readSpotifyProcesses } from './read_spotify_processes';
import { selectMainSpotifyProcesses } from './select_main_spotify_processes';
import { SpotifyKillError } from './spotify_kill_error';

type KillSpotifyOptions = Readonly<{
	procFileSystem?: ProcFileSystem;
	sendSignal?: (processId: number, signal: NodeJS.Signals) => void;
}>;

function isProcessGone(error: unknown): boolean {
	return error instanceof Error && Reflect.get(error, 'code') === 'ESRCH';
}

/**
 * Asks Spotify to quit with SIGTERM, sent to the main process only: it closes its helpers itself.
 * A process that is already gone is not an error; the caller waits for the exit.
 */
export async function killSpotify(
	options: KillSpotifyOptions = {}
): Promise<void> {
	const sendSignal =
		options.sendSignal ??
		((processId, signal) => process.kill(processId, signal));
	const processes = await readSpotifyProcesses(
		options.procFileSystem ?? nodeProcFileSystem
	);
	for (const { processId } of selectMainSpotifyProcesses(processes)) {
		try {
			sendSignal(processId, 'SIGTERM');
		} catch (error) {
			if (!isProcessGone(error)) {
				throw new SpotifyKillError({ processId, cause: error });
			}
		}
	}
}
