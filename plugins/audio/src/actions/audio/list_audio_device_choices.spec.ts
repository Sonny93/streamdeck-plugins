import { describe, expect, it } from 'vitest';

import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { readAudioSnapshot } from '../../audio/read_audio_snapshot';
import { listAudioDeviceChoices } from './list_audio_device_choices';

function readSnapshot() {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('microphone', 'input'));
	return readAudioSnapshot(coreAudio);
}

describe('listAudioDeviceChoices', () => {
	it('groups the defaults, the outputs and the inputs', () => {
		expect(
			listAudioDeviceChoices({
				snapshot: readSnapshot(),
				choices: {
					event: 'listAudioDevices',
					flows: ['output', 'input'],
					offersDefaults: true,
				},
				pickedValue: undefined,
			})
		).toEqual([
			{
				label: 'Follow Windows',
				children: [
					{ label: 'Default output', value: 'default:output' },
					{ label: 'Default input', value: 'default:input' },
				],
			},
			{
				label: 'Outputs',
				children: [{ label: 'Device headphones', value: 'headphones' }],
			},
			{
				label: 'Inputs',
				children: [{ label: 'Device microphone', value: 'microphone' }],
			},
		]);
	});

	it('keeps listing the picked device while it is unplugged', () => {
		const choices = listAudioDeviceChoices({
			snapshot: readSnapshot(),
			choices: {
				event: 'listOutputDevices',
				flows: ['output'],
				offersDefaults: false,
			},
			pickedValue: 'fiio',
		});

		expect(choices[0]).toEqual({ label: 'Unplugged device', value: 'fiio' });
		expect(choices).toHaveLength(2);
	});
});
