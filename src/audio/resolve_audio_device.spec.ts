import { describe, expect, it } from 'vitest';

import { FakeCoreAudio } from './fake_core_audio';
import { buildAudioDevice } from './build_audio_device';
import { readAudioSnapshot } from './read_audio_snapshot';
import { resolveAudioDevice } from './resolve_audio_device';

function readSnapshot() {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('speakers'));
	return readAudioSnapshot(coreAudio);
}

describe('resolveAudioDevice', () => {
	it('follows the default device of a direction', () => {
		expect(
			resolveAudioDevice(readSnapshot(), { kind: 'default', flow: 'output' })
		).toEqual(buildAudioDevice('headphones'));
	});

	it('finds a fixed device', () => {
		expect(
			resolveAudioDevice(readSnapshot(), {
				kind: 'device',
				deviceId: 'speakers',
			})
		).toEqual(buildAudioDevice('speakers'));
	});

	it('finds nothing for an unplugged device or a direction without default', () => {
		const snapshot = readSnapshot();

		expect(
			resolveAudioDevice(snapshot, { kind: 'device', deviceId: 'fiio' })
		).toBeUndefined();
		expect(
			resolveAudioDevice(snapshot, { kind: 'default', flow: 'input' })
		).toBeUndefined();
	});
});
