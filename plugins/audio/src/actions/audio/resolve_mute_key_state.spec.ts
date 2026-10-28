import { describe, expect, it } from 'vitest';

import { buildAudioDevice } from '../../audio/build_audio_device';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { readAudioSnapshot } from '../../audio/read_audio_snapshot';
import { KeyState } from '../keys/key_state';
import { resolveMuteKeyState } from './resolve_mute_key_state';

function readSnapshot() {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('microphone', 'input'), {
		level: 0.8,
		isMuted: true,
	});
	return readAudioSnapshot(coreAudio);
}

describe('resolveMuteKeyState', () => {
	it('shows whether the device is muted', () => {
		const snapshot = readSnapshot();

		expect(
			resolveMuteKeyState(snapshot, { kind: 'default', flow: 'input' })
		).toBe(KeyState.on);
		expect(
			resolveMuteKeyState(snapshot, { kind: 'default', flow: 'output' })
		).toBe(KeyState.off);
	});

	it('dims the key while the devices are unknown or the device is unplugged', () => {
		expect(
			resolveMuteKeyState(undefined, { kind: 'default', flow: 'input' })
		).toBe(KeyState.unavailable);
		expect(
			resolveMuteKeyState(readSnapshot(), { kind: 'device', deviceId: 'fiio' })
		).toBe(KeyState.unavailable);
	});
});
