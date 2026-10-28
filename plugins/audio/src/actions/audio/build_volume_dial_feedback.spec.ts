import { describe, expect, it } from 'vitest';

import { FakeCoreAudio } from '../../audio/fake_core_audio';
import { buildAudioDevice } from '../../audio/build_audio_device';
import { readAudioSnapshot } from '../../audio/read_audio_snapshot';
import { buildVolumeDialFeedback } from './build_volume_dial_feedback';

const DEFAULT_OUTPUT = { kind: 'default', flow: 'output' } as const;

describe('buildVolumeDialFeedback', () => {
	it('shows the device and its volume', () => {
		const coreAudio = new FakeCoreAudio();
		coreAudio.plug(buildAudioDevice('headphones'), {
			level: 0.699_999_988,
			isMuted: false,
		});

		expect(
			buildVolumeDialFeedback(readAudioSnapshot(coreAudio), DEFAULT_OUTPUT)
		).toEqual({
			title: 'Device headphones',
			value: '70 %',
			indicator: { value: 70, opacity: 1 },
		});
	});

	it('fades the bar of a muted device', () => {
		const coreAudio = new FakeCoreAudio();
		coreAudio.plug(buildAudioDevice('headphones'), {
			level: 0.5,
			isMuted: true,
		});

		const feedback = buildVolumeDialFeedback(
			readAudioSnapshot(coreAudio),
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
