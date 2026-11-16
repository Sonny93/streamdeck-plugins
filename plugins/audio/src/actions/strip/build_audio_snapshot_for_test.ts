import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import type { LinuxAudioEntry } from '../../linux/linux_audio_entry';

/** Test factory: the snapshot of devices plugged in order, the first of each direction being its default. */
export function buildAudioSnapshotForTest(
	entries: readonly LinuxAudioEntry[]
): Promise<AudioSnapshot> {
	const coreAudio = new FakeCoreAudio();
	for (const entry of entries) {
		coreAudio.plug(entry.device, entry.volume);
	}
	return coreAudio.readSnapshot();
}
