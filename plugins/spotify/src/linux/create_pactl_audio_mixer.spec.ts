import { describe, expect, it, vi } from 'vitest';

import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { buildRawSinkInput } from './build_raw_sink_input';
import { createPactlAudioMixer } from './create_pactl_audio_mixer';
import { FIREFOX_AND_SPOTIFY_CLIENT_LISTING } from './fixtures/firefox_and_spotify_client_listing';
import { FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING } from './fixtures/firefox_and_spotify_sink_input_listing';

const LISTING = [
	buildRawSinkInput({ index: 7, binary: 'spotify', volumePercents: [50, 50] }),
	buildRawSinkInput({ index: 9, binary: 'spotify', volumePercents: [20, 20] }),
	buildRawSinkInput({ index: 12, binary: 'firefox' }),
];

function buildMixer(listing: unknown, clients: unknown = []) {
	const runCommand = vi.fn((options: Readonly<{ args: readonly string[] }>) => {
		if (options.args.includes('sink-inputs')) {
			return Promise.resolve(JSON.stringify(listing));
		}
		return Promise.resolve(
			options.args.includes('clients') ? JSON.stringify(clients) : ''
		);
	});
	const mixer = createPactlAudioMixer({
		runCommand,
		readForegroundApp: () => Promise.resolve({ imageName: 'firefox' }),
		procFileSystem: buildFakeProcFileSystem([
			{ processId: 4242, command: 'game', parentId: 4000 },
			{ processId: 4000, command: 'launcher', parentId: 1 },
		]),
	});
	return { mixer, runCommand };
}

function changeCalls(runCommand: ReturnType<typeof vi.fn>): unknown[] {
	return runCommand.mock.calls
		.map(([options]) => options)
		.filter((options) => !options.args.includes('list'))
		.map((options) => options.args);
}

describe('createPactlAudioMixer', () => {
	it('should list Spotify, a native PipeWire client, next to Firefox from the real capture', async () => {
		const { mixer } = buildMixer(
			FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING,
			FIREFOX_AND_SPOTIFY_CLIENT_LISTING
		);

		expect(
			(await mixer.listApps()).map((app) => [app.imageName, app.displayName])
		).toStrictEqual([
			['firefox', 'Firefox'],
			['spotify', 'Spotify'],
		]);
	});

	it('should list, for each app, the processes of its streams and the ones that started them', async () => {
		const { mixer } = buildMixer([
			buildRawSinkInput({
				index: 9,
				binary: 'BeamNG.drive.x64',
				processId: 4242,
			}),
		]);

		const [app] = await mixer.listApps();

		expect(app?.processIds).toStrictEqual([4242, 4000]);
	});

	it('should ask pactl for the sink inputs and the clients as JSON', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		await mixer.listApps();

		expect(
			runCommand.mock.calls.map(([options]) => options.args)
		).toStrictEqual([
			['-f', 'json', 'list', 'sink-inputs'],
			['-f', 'json', 'list', 'clients'],
		]);
	});

	it('should set the volume of every stream of the app', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		await mixer.updateApp('spotify', { volume: 0.34 });

		expect(changeCalls(runCommand)).toStrictEqual([
			['set-sink-input-volume', '7', '34%'],
			['set-sink-input-volume', '9', '34%'],
		]);
	});

	it('should set the mute state of every stream of the app', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		await mixer.updateApp('spotify', { isMuted: true });

		expect(changeCalls(runCommand)).toStrictEqual([
			['set-sink-input-mute', '7', '1'],
			['set-sink-input-mute', '9', '1'],
		]);
	});

	it('should match a name saved on Windows with .exe', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		await mixer.updateApp('Firefox.exe', { isMuted: false });

		expect(changeCalls(runCommand)).toStrictEqual([
			['set-sink-input-mute', '12', '0'],
		]);
	});

	it('should resolve to false and change nothing when no stream matches', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		const isUpdated = await mixer.updateApp('vlc', { volume: 0.5 });

		expect([isUpdated, changeCalls(runCommand)]).toStrictEqual([false, []]);
	});

	it('should never pass a saved name to pactl', async () => {
		const { mixer, runCommand } = buildMixer(LISTING);

		await mixer.updateApp('spotify; rm -rf', { volume: 0.5 });

		expect(changeCalls(runCommand)).toStrictEqual([]);
	});

	it('should serve the foreground reader it was given', async () => {
		const { mixer } = buildMixer(LISTING);

		expect(await mixer.readForegroundApp()).toStrictEqual({
			imageName: 'firefox',
		});
	});
});
