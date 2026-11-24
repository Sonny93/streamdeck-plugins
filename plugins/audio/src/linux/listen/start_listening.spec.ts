import { describe, expect, it } from 'vitest';

import { createLinuxSourceListening } from './create_linux_source_listening';
import {
	FAKE_MIC,
	FAKE_MIC_INDEX,
	FAKE_VOLT,
	INVALID_SOURCE_INDEX,
	NEW_MODULE_INDEX,
	buildFakeMic,
	buildLoopbackRow,
	createFakeListenSystem,
	instantSchedule,
	type FakeSource,
	type LoadBehavior,
} from './fake_listen_system';
import { ListenLevelNotAppliedError } from './listen_level_not_applied_error';
import { ListenSettings } from './listen_settings';
import { ListenSourceNotAvailableError } from './listen_source_not_available_error';
import { LoopbackNotVerifiedError } from './loopback_not_verified_error';

const LEVEL = 0.08;
const LOWER_LEVEL = 0.05;

function setUp(options: Parameters<typeof createFakeListenSystem>[0] = {}) {
	const system = createFakeListenSystem(options);
	const listening = createLinuxSourceListening({
		runCommand: system.runCommand,
		schedule: instantSchedule,
	});
	return { system, listening };
}

function loadsOf(writes: readonly string[][]): string[][] {
	return writes.filter((args) => args[0] === 'load-module');
}

describe('startListening', () => {
	it('should set the volume before it loads the loopback', async () => {
		const { system, listening } = setUp();

		await listening.startListening(FAKE_MIC, LEVEL);

		expect(system.writes().map((args) => args[0])).toEqual([
			'set-source-volume',
			'load-module',
		]);
	});

	it('should load a loopback of that source with the latency, the pinned source and the stream properties', async () => {
		const { system, listening } = setUp();

		await listening.startListening(FAKE_MIC, LEVEL);

		expect(loadsOf(system.writes())).toEqual([
			[
				'load-module',
				'module-loopback',
				`source=${FAKE_MIC}`,
				'latency_msec=1',
				'source_dont_move=true',
				`source_output_properties="node.dont-fallback=true state.restore-props=false ${ListenSettings.loopbackTag}"`,
				'sink_input_properties="state.restore-props=false"',
			],
		]);
	});

	it('should not load when the volume stays too high on read back', async () => {
		const { system, listening } = setUp({ applyVolume: false });

		await expect(
			listening.startListening(FAKE_MIC, LOWER_LEVEL)
		).rejects.toBeInstanceOf(ListenLevelNotAppliedError);
		expect(loadsOf(system.writes())).toEqual([]);
	});

	it.each<[string, Partial<FakeSource>]>([
		['a monitor', { kind: 'monitor' }],
		['a virtual source', { kind: 'virtual' }],
		['a source without device.api', { kind: 'hardware-without-api' }],
		['a dash-prefixed name', { name: '-alsa_input' }],
		['a name with a space', { name: 'alsa input' }],
	])('should not set the volume nor load for %s', async (_label, override) => {
		const source = { ...buildFakeMic(), ...override };
		const { system, listening } = setUp({ sources: [source] });

		await expect(
			listening.startListening(source.name, LEVEL)
		).rejects.toBeInstanceOf(ListenSourceNotAvailableError);
		expect(system.writes()).toEqual([]);
	});

	it('should not set the volume nor load when the id is not listed', async () => {
		const { system, listening } = setUp();

		await expect(
			listening.startListening('missing.source', LEVEL)
		).rejects.toBeInstanceOf(ListenSourceNotAvailableError);
		expect(system.writes()).toEqual([]);
	});

	it('should only set the volume when a loopback already captures the source', async () => {
		const { system, listening } = setUp({
			modules: [buildLoopbackRow(9, FAKE_MIC)],
			captureStreams: [
				{ ownerModule: 9, sourceIndex: FAKE_MIC_INDEX, levels: [1, 1] },
			],
		});

		await listening.startListening(FAKE_MIC, LEVEL);

		expect(system.writes()).toEqual([['set-source-volume', FAKE_MIC, '8%']]);
	});

	it('should resolve with the module index of the loopback it loaded', async () => {
		const { listening } = setUp();

		expect(await listening.startListening(FAKE_MIC, LEVEL)).toBe(
			NEW_MODULE_INDEX
		);
	});

	it('should resolve with the first loopback of the plugin when several already capture the source', async () => {
		const { system, listening } = setUp({
			modules: [
				buildLoopbackRow(8, FAKE_MIC),
				buildLoopbackRow(9, FAKE_MIC, true),
				buildLoopbackRow(10, FAKE_MIC, true),
			],
		});

		expect(await listening.startListening(FAKE_MIC, LEVEL)).toBe(9);
		expect(loadsOf(system.writes())).toEqual([]);
	});

	it('should set the level, load nothing and resolve undefined when only an untagged loopback serves the source', async () => {
		const { system, listening } = setUp({
			modules: [buildLoopbackRow(8, FAKE_MIC), buildLoopbackRow(9, FAKE_MIC)],
		});

		const moduleIndex = await listening.startListening(FAKE_MIC, LEVEL);

		expect(moduleIndex).toBeUndefined();
		expect(system.writes()).toEqual([['set-source-volume', FAKE_MIC, '8%']]);
	});

	it('should not load when a loopback asks for another source but its stream is linked to this one', async () => {
		const { system, listening } = setUp({
			modules: [buildLoopbackRow(9, 'other.source')],
			captureStreams: [
				{ ownerModule: 9, sourceIndex: FAKE_MIC_INDEX, levels: [1, 1] },
			],
		});

		await listening.startListening(FAKE_MIC, LEVEL);

		expect(loadsOf(system.writes())).toEqual([]);
	});

	it('should load for a source that only another source has a loopback of', async () => {
		const { system, listening } = setUp({
			modules: [buildLoopbackRow(9, FAKE_VOLT)],
		});

		await listening.startListening(FAKE_MIC, LEVEL);

		expect(loadsOf(system.writes())).toHaveLength(1);
	});

	it.each<[string, LoadBehavior, string]>([
		[
			'the capture stream is linked to another source',
			'linked-to-other-source',
			'wrong-source',
		],
		[
			'the capture stream is above 100 %',
			'loud-capture',
			'capture-volume-too-high',
		],
		[
			'the playback stream is above 100 %',
			'loud-playback',
			'playback-volume-too-high',
		],
		['no capture stream shows up', 'no-stream', 'stream-missing'],
		['the module row lacks the tag', 'tag-missing', 'tag-missing'],
		['the capture stream never gets linked', 'never-linked', 'stream-unlinked'],
	])(
		'should unload the new module when %s',
		async (_label, loadBehavior, failure) => {
			const { system, listening } = setUp({ loadBehavior });

			const error: unknown = await listening
				.startListening(FAKE_MIC, LEVEL)
				.catch((caught: unknown) => caught);

			expect(error).toBeInstanceOf(LoopbackNotVerifiedError);
			expect((error as LoopbackNotVerifiedError).failure).toBe(failure);
			expect(system.writes().at(-1)).toEqual([
				'unload-module',
				String(NEW_MODULE_INDEX),
			]);
		}
	);

	it('should keep the loopback when its capture stream is unlinked on the first reads and linked to the source later', async () => {
		const { system, listening } = setUp({ loadBehavior: 'linked-late' });

		const moduleIndex = await listening.startListening(FAKE_MIC, LEVEL);

		expect(moduleIndex).toBe(NEW_MODULE_INDEX);
		expect(system.writes().map((args) => args[0])).not.toContain(
			'unload-module'
		);
	});

	it('should fail at once with the linked source in the message when the stream is linked to another known source', async () => {
		const { system, listening } = setUp({
			loadBehavior: 'linked-to-other-source',
		});

		const error: unknown = await listening
			.startListening(FAKE_MIC, LEVEL)
			.catch((caught: unknown) => caught);

		expect((error as LoopbackNotVerifiedError).message).toContain(
			`linked to ${FAKE_VOLT}`
		);
		expect(
			system.calls.filter((args) => args.includes('source-outputs'))
		).toHaveLength(2);
	});

	it('should read the stream the whole budget and report the source index it showed when it never gets linked', async () => {
		const { system, listening } = setUp({ loadBehavior: 'never-linked' });

		const error: unknown = await listening
			.startListening(FAKE_MIC, LEVEL)
			.catch((caught: unknown) => caught);

		expect((error as LoopbackNotVerifiedError).message).toContain(
			`source index ${INVALID_SOURCE_INDEX}`
		);
		expect(
			system.calls.filter((args) => args.includes('source-outputs'))
		).toHaveLength(ListenSettings.verifyAttempts + 1);
	});

	it('should unload the loopback that loaded although load-module failed, and rethrow', async () => {
		const { system, listening } = setUp({ loadBehavior: 'fail-after-loading' });

		await expect(listening.startListening(FAKE_MIC, LEVEL)).rejects.toThrow(
			'load-module failed'
		);
		expect(system.writes().at(-1)).toEqual([
			'unload-module',
			String(NEW_MODULE_INDEX),
		]);
	});

	it('should unload nothing when load-module failed without loading', async () => {
		const { system, listening } = setUp({
			loadBehavior: 'fail-without-loading',
		});

		await expect(listening.startListening(FAKE_MIC, LEVEL)).rejects.toThrow(
			'load-module failed'
		);
		expect(system.writes().map((args) => args[0])).not.toContain(
			'unload-module'
		);
	});

	it('should leave a loopback that was loaded before alone, tagged or not, when load-module failed after loading', async () => {
		const { system, listening } = setUp({
			loadBehavior: 'fail-after-loading',
			modules: [
				buildLoopbackRow(9, FAKE_VOLT, true),
				buildLoopbackRow(10, FAKE_VOLT),
			],
		});

		await listening.startListening(FAKE_MIC, LEVEL).catch(() => undefined);

		expect(
			system.writes().filter((args) => args[0] === 'unload-module')
		).toEqual([['unload-module', String(NEW_MODULE_INDEX)]]);
	});
});
