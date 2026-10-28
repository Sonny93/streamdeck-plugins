import type { AudioApp } from './audio_app';
import { readImageName } from './read_image_name';
import { formatAppDisplayName } from './format_app_display_name';
import type { AudioSessionSnapshot } from '../windows/audio_session_snapshot';

type AppGroup = { imageName: string; volume: number; isMuted: boolean };

/**
 * Groups the audio sessions by executable name (ignoring case), one app per executable, sorted by readable name.
 * An app with several sessions (one per output device, or per child process) shows its loudest volume and counts as muted only when all are.
 * The system sounds and the sessions of processes that cannot be inspected are left out.
 */
export function summarizeAudioApps(
	sessions: readonly AudioSessionSnapshot[]
): AudioApp[] {
	const groups = new Map<string, AppGroup>();
	for (const session of sessions) {
		if (session.imagePath === undefined) {
			continue;
		}
		const imageName = readImageName(session.imagePath);
		const key = imageName.toLowerCase();
		const group = groups.get(key);
		if (group === undefined) {
			groups.set(key, {
				imageName,
				volume: session.volume,
				isMuted: session.isMuted,
			});
			continue;
		}
		group.volume = Math.max(group.volume, session.volume);
		group.isMuted &&= session.isMuted;
	}
	return [...groups.values()]
		.map((group) => ({
			...group,
			displayName: formatAppDisplayName(group.imageName),
		}))
		.sort((first, second) =>
			first.displayName.localeCompare(second.displayName)
		);
}
