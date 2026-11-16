import { describe, expect, it } from 'vitest';

import type { AudioSnapshot } from './audio_snapshot';
import { buildAudioDevice } from './build_audio_device';
import { FakeCoreAudio } from './fake_core_audio';
import { resolveAudioDevice } from './resolve_audio_device';

function readSnapshot(): Promise<AudioSnapshot> {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('speakers'));
	return coreAudio.readSnapshot();
}

describe('resolveAudioDevice', () => {
	it('follows the default device of a direction', async () => {
		expect(
			resolveAudioDevice(await readSnapshot(), {
				kind: 'default',
				flow: 'output',
			})
		).toEqual(buildAudioDevice('headphones'));
	});

	it('finds a fixed device', async () => {
		expect(
			resolveAudioDevice(await readSnapshot(), {
				kind: 'device',
				deviceId: 'speakers',
			})
		).toEqual(buildAudioDevice('speakers'));
	});

	it('finds nothing for an unplugged device or a direction without default', async () => {
		const snapshot = await readSnapshot();

		expect(
			resolveAudioDevice(snapshot, { kind: 'device', deviceId: 'fiio' })
		).toBeUndefined();
		expect(
			resolveAudioDevice(snapshot, { kind: 'default', flow: 'input' })
		).toBeUndefined();
	});
});
