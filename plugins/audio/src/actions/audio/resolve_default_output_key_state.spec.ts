import { describe, expect, it } from 'vitest';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { KeyState } from '../keys/key_state';
import { resolveDefaultOutputKeyState } from './resolve_default_output_key_state';

function readSnapshot(): Promise<AudioSnapshot> {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('speakers'));
	return coreAudio.readSnapshot();
}

describe('resolveDefaultOutputKeyState', () => {
	it('lights the key of the default output only', async () => {
		const snapshot = await readSnapshot();

		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'headphones',
			})
		).toBe(KeyState.on);
		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'speakers',
			})
		).toBe(KeyState.off);
	});

	it('dims the key of an unplugged or unpicked device', async () => {
		const snapshot = await readSnapshot();

		expect(
			resolveDefaultOutputKeyState(snapshot, {
				kind: 'device',
				deviceId: 'fiio',
			})
		).toBe(KeyState.unavailable);
		expect(resolveDefaultOutputKeyState(snapshot, undefined)).toBe(
			KeyState.unavailable
		);
	});
});
