import { describe, expect, it } from 'vitest';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { listAudioDeviceChoices } from './list_audio_device_choices';

function readSnapshot(): Promise<AudioSnapshot> {
	const coreAudio = new FakeCoreAudio();
	coreAudio.plug(buildAudioDevice('headphones'));
	coreAudio.plug(buildAudioDevice('microphone', 'input'));
	return coreAudio.readSnapshot();
}

describe('listAudioDeviceChoices', () => {
	it('groups the defaults, the outputs and the inputs', async () => {
		expect(
			listAudioDeviceChoices({
				language: 'en',
				snapshot: await readSnapshot(),
				choices: {
					event: 'listAudioDevices',
					flows: ['output', 'input'],
					offersDefaults: true,
				},
				pickedValue: undefined,
			})
		).toEqual([
			{
				label: 'Follow system',
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

	it('keeps listing the picked device while it is unplugged', async () => {
		const choices = listAudioDeviceChoices({
			language: 'en',
			snapshot: await readSnapshot(),
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

	it('names the groups and the defaults in French', async () => {
		const choices = listAudioDeviceChoices({
			language: 'fr',
			snapshot: await readSnapshot(),
			choices: {
				event: 'listAudioDevices',
				flows: ['output', 'input'],
				offersDefaults: true,
			},
			pickedValue: 'fiio',
		});

		expect(choices.map((choice) => choice.label)).toEqual([
			'Périphérique débranché',
			'Suivre le système',
			'Sorties',
			'Entrées',
		]);
		expect(choices[1]).toMatchObject({
			children: [
				{ label: 'Sortie par défaut' },
				{ label: 'Entrée par défaut' },
			],
		});
	});
});
