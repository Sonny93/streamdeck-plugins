import { nodeProcFileSystem } from './node_proc_file_system';
import type { ProcFileSystem } from './proc_file_system';
import { readSpotifyProcesses } from './read_spotify_processes';

/** Tells whether any process named `spotify` is running, helpers included, so a half-closed Spotify still counts. */
export async function isSpotifyRunning(
	procFileSystem: ProcFileSystem = nodeProcFileSystem
): Promise<boolean> {
	return (await readSpotifyProcesses(procFileSystem)).length > 0;
}
