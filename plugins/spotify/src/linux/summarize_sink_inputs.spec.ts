import { describe, expect, it } from 'vitest';

import type { SinkInput } from './sink_input';
import { summarizeSinkInputs } from './summarize_sink_inputs';

function buildSinkInput(overrides: Partial<SinkInput>): SinkInput {
	return {
		index: 1,
		imageName: 'firefox',
		displayName: 'Firefox',
		volume: 0.5,
		isMuted: false,
		processId: undefined,
		...overrides,
	};
}

describe('summarizeSinkInputs', () => {
	it('should give one app per binary with the loudest volume', () => {
		expect(
			summarizeSinkInputs([
				buildSinkInput({ index: 1, volume: 0.3 }),
				buildSinkInput({ index: 2, volume: 0.8 }),
			])
		).toStrictEqual([
			{
				imageName: 'firefox',
				displayName: 'Firefox',
				volume: 0.8,
				isMuted: false,
				processIds: [],
			},
		]);
	});

	it('should list the process of each stream of an app', () => {
		const [app] = summarizeSinkInputs([
			buildSinkInput({ index: 1, processId: 20 }),
			buildSinkInput({ index: 2, processId: 21 }),
			buildSinkInput({ index: 3, processId: 20 }),
		]);

		expect(app?.processIds).toStrictEqual([20, 21]);
	});

	it('should count an app as muted only when all its streams are', () => {
		const apps = summarizeSinkInputs([
			buildSinkInput({ index: 1, isMuted: true }),
			buildSinkInput({ index: 2, isMuted: false }),
		]);

		expect(apps[0]?.isMuted).toBe(false);
	});

	it('should sort the apps by readable name', () => {
		const apps = summarizeSinkInputs([
			buildSinkInput({ imageName: 'spotify', displayName: 'Spotify' }),
			buildSinkInput({ imageName: 'firefox', displayName: 'Firefox' }),
		]);

		expect(apps.map((app) => app.displayName)).toStrictEqual([
			'Firefox',
			'Spotify',
		]);
	});
});
