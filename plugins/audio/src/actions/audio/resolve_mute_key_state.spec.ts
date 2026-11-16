import { describe, expect, it } from 'vitest';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { KeyState } from '../keys/key_state';
import { resolveMuteKeyState } from './resolve_mute_key_state';

function readSnapshot(): Promise<AudioSnapshot> {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('microphone', 'input'), {
		level: 0.8,
		isMuted: true,
	});
	return coreAudio.readSnapshot();
}

describe('resolveMuteKeyState', () => {
	it('shows whether the device is muted', async () => {
		const snapshot = await readSnapshot();

		expect(
			resolveMuteKeyState(snapshot, { kind: 'default', flow: 'input' })
		).toBe(KeyState.on);
		expect(
			resolveMuteKeyState(snapshot, { kind: 'default', flow: 'output' })
		).toBe(KeyState.off);
	});

	it('dims the key while the devices are unknown or the device is unplugged', async () => {
		expect(
			resolveMuteKeyState(undefined, { kind: 'default', flow: 'input' })
		).toBe(KeyState.unavailable);
		expect(
			resolveMuteKeyState(await readSnapshot(), {
				kind: 'device',
				deviceId: 'fiio',
			})
		).toBe(KeyState.unavailable);
	});
});
