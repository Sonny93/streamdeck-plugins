import type { SpotifyProcess } from './spotify_process';

/** Keeps the Spotify processes whose parent is not a Spotify process: the main browser process, not its renderers and helpers. */
export function selectMainSpotifyProcesses(
	processes: readonly SpotifyProcess[]
): SpotifyProcess[] {
	const processIds = new Set(processes.map((process) => process.processId));
	return processes.filter((process) => !processIds.has(process.parentId));
}
