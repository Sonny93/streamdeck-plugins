import { describe, expect, it } from 'vitest';

import { readAudioTarget } from './read_audio_target';

const DEFAULT_INPUT = { kind: 'default', flow: 'input' } as const;

describe('readAudioTarget', () => {
	it('reads the default device of a direction', () => {
		expect(readAudioTarget({ device: 'default:output' }, undefined)).toEqual({
			kind: 'default',
			flow: 'output',
		});
	});

	it('reads a fixed device', () => {
		expect(
			readAudioTarget(
				{ device: '{0.0.0.00000000}.{11111111-2222-4333-8444-555555555555}' },
				undefined
			)
		).toEqual({
			kind: 'device',
			deviceId: '{0.0.0.00000000}.{11111111-2222-4333-8444-555555555555}',
		});
	});

	it('falls back to the action default without a valid device', () => {
		expect(readAudioTarget({}, DEFAULT_INPUT)).toEqual(DEFAULT_INPUT);
		expect(readAudioTarget({ device: ' ' }, DEFAULT_INPUT)).toEqual(
			DEFAULT_INPUT
		);
		expect(readAudioTarget({ device: 42 }, undefined)).toBeUndefined();
	});
});
