import { describe, expect, it } from 'vitest';

import { buildRawSinkInput } from './build_raw_sink_input';
import { FIREFOX_AND_SPOTIFY_CLIENT_LISTING } from './fixtures/firefox_and_spotify_client_listing';
import { FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING } from './fixtures/firefox_and_spotify_sink_input_listing';
import { parseClients } from './parse_clients';
import { parseSinkInputs } from './parse_sink_inputs';

describe('parseSinkInputs', () => {
	it('should read the real Firefox and Spotify streams', () => {
		expect(
			parseSinkInputs(
				FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING,
				parseClients(FIREFOX_AND_SPOTIFY_CLIENT_LISTING)
			).map(({ index, imageName, displayName }) => [
				index,
				imageName,
				displayName,
			])
		).toStrictEqual([
			[593, 'spotify', 'Spotify'],
			[843, 'firefox', 'Firefox'],
		]);
	});

	it('should name a stream after the binary of its client when it has none', () => {
		const [sinkInput] = parseSinkInputs(
			[buildRawSinkInput({ clientId: 5, nodeName: 'Whatever' })],
			new Map([[5, { binary: 'mpv', processId: undefined }]])
		);

		expect(sinkInput?.imageName).toBe('mpv');
	});

	it('should prefer the binary of the stream over the one of its client', () => {
		const [sinkInput] = parseSinkInputs(
			[buildRawSinkInput({ clientId: 5, binary: 'firefox' })],
			new Map([[5, { binary: 'other', processId: undefined }]])
		);

		expect(sinkInput?.imageName).toBe('firefox');
	});

	it('should read the process of the stream, else the one of its client', () => {
		const sinkInputs = parseSinkInputs(
			[
				buildRawSinkInput({ index: 1, binary: 'game', processId: 49_021 }),
				buildRawSinkInput({ index: 2, clientId: 5, nodeName: 'spotify' }),
			],
			new Map([[5, { binary: 'spotify', processId: 4242 }]])
		);

		expect(sinkInputs.map((sinkInput) => sinkInput.processId)).toStrictEqual([
			49_021, 4242,
		]);
	});

	it('should fall back to the lowercased node name', () => {
		const [sinkInput] = parseSinkInputs([
			buildRawSinkInput({ clientId: 5, nodeName: 'Spotify' }),
		]);

		expect(sinkInput?.imageName).toBe('spotify');
	});

	it('should average the volume of the channels', () => {
		const [sinkInput] = parseSinkInputs([
			buildRawSinkInput({ binary: 'spotify', volumePercents: [40, 60] }),
		]);

		expect(sinkInput?.volume).toBe(0.5);
	});

	it('should cap a boosted volume at 1', () => {
		const [sinkInput] = parseSinkInputs([
			buildRawSinkInput({ binary: 'spotify', volumePercents: [153, 153] }),
		]);

		expect(sinkInput?.volume).toBe(1);
	});

	it('should read the mute state', () => {
		const [sinkInput] = parseSinkInputs([
			buildRawSinkInput({ binary: 'spotify', isMuted: true }),
		]);

		expect(sinkInput?.isMuted).toBe(true);
	});

	it('should name the app after its binary when it has no application name', () => {
		const [sinkInput] = parseSinkInputs([
			buildRawSinkInput({ binary: 'spotify' }),
		]);

		expect(sinkInput?.displayName).toBe('Spotify');
	});

	it('should leave out a stream without a binary', () => {
		expect(
			parseSinkInputs([buildRawSinkInput({ applicationName: 'Unknown' })])
		).toStrictEqual([]);
	});

	it('should leave out a stream without any channel volume', () => {
		expect(
			parseSinkInputs([
				buildRawSinkInput({ binary: 'spotify', volumePercents: [] }),
			])
		).toStrictEqual([]);
	});

	it('should return nothing for output that is not a list', () => {
		expect(parseSinkInputs({ error: 'boom' })).toStrictEqual([]);
	});
});
