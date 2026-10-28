import type { AudioSnapshot } from './audio_snapshot';

/**
 * Tells whether two snapshots hold the same devices, defaults and volumes, so polls that find nothing new redraw nothing.
 * Snapshots are plain data read in a stable order, so their JSON forms compare them.
 */
export function isSameAudioSnapshot(
	first: AudioSnapshot | undefined,
	second: AudioSnapshot | undefined
): boolean {
	return JSON.stringify(first) === JSON.stringify(second);
}
