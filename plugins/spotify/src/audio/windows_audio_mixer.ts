import { loadCoreAudio } from '../windows/load_core_audio';
import { loadUser32 } from '../windows/load_user32';
import type { AudioMixer } from './audio_mixer';
import { isSameImageName } from './is_same_image_name';
import { readImageName } from './read_image_name';
import { summarizeAudioApps } from './summarize_audio_apps';

/**
 * The OS mixer of Windows, through Core Audio and user32.
 * A change applies to every session of the executable on every active output device; the foreground app is the process owning the foreground window.
 */
export const windowsAudioMixer: AudioMixer = {
	listApps: async () =>
		summarizeAudioApps((await loadCoreAudio()).listSessions()),
	updateApp: async (imageName, change) => {
		const coreAudio = await loadCoreAudio();
		const updated = coreAudio.updateSessions(
			(session) =>
				session.imagePath !== undefined &&
				isSameImageName(readImageName(session.imagePath), imageName),
			change
		);
		return updated > 0;
	},
	readForegroundImageName: async () => {
		const user32 = await loadUser32();
		const window = user32.getForegroundWindow();
		if (window === undefined) {
			return undefined;
		}
		const imagePath = (await loadCoreAudio()).readProcessImagePath(
			user32.readProcessId(window)
		);
		return imagePath === undefined ? undefined : readImageName(imagePath);
	},
};
