import { describe, expect, it } from 'vitest';

import { AudioKeyState } from './audio_key_state';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { readAudioSnapshot } from '../../audio/read_audio_snapshot';
import { resolveDefaultOutputKeyState } from './resolve_default_output_key_state';

function readSnapshot() {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('speakers'));
	return readAudioSnapshot(coreAudio);
}

describe('resolveDefaultOutputKeyState', () => {
	it('lights the key of the default output only', () => {
		const snapshot = readSnapshot();

		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'headphones',
			})
		).toBe(AudioKeyState.on);
		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'speakers',
			})
		).toBe(AudioKeyState.off);
	});

	it('dims the key of an unplugged or unpicked device', () => {
		const snapshot = readSnapshot();

		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'fiio',
			})
		).toBe(AudioKeyState.unavailable);
		expect(resolveDefaultOutputKeyState(snapshot, undefined)).toBe(
			AudioKeyState.unavailable
		);
	});
});
