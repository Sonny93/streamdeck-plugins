import { describe, expect, it } from 'vitest';

import { buildAudioDevice } from '../../audio/build_audio_device';
import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { buildVolumeDialFeedback } from './build_volume_dial_feedback';

const DEFAULT_OUTPUT = { kind: 'default', flow: 'output' } as const;

describe('buildVolumeDialFeedback', () => {
	it('shows the device and its volume', async () => {
		const coreAudio = new FakeCoreAudio();
		coreAudio.plug(buildAudioDevice('headphones'), {
			level: 0.699_999_988,
			isMuted: false,
		});

		expect(
			buildVolumeDialFeedback(await coreAudio.readSnapshot(), DEFAULT_OUTPUT)
		).toEqual({
			title: 'Device headphones',
			value: '70 %',
			indicator: { value: 70, opacity: 1 },
		});
	});

	it('fades the bar of a muted device', async () => {
		const coreAudio = new FakeCoreAudio();
		coreAudio.plug(buildAudioDevice('headphones'), {
			level: 0.5,
			isMuted: true,
		});

		const feedback = buildVolumeDialFeedback(
			await coreAudio.readSnapshot(),
			DEFAULT_OUTPUT
		);
		expect(feedback.value).toBe('Muted');
		expect(feedback.indicator.opacity).toBeLessThan(1);
	});

	it('says when there is no device to show', () => {
		expect(buildVolumeDialFeedback(undefined, DEFAULT_OUTPUT).value).toBe(
			'No device'
		);
	});
});
