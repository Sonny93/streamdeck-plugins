import type { CommandRunner } from 'deck-kit/process/run_command';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { createLinuxSourceListening } from './create_linux_source_listening';
import {
	FAKE_MIC,
	FAKE_MIC_INDEX,
	FAKE_VOLT,
	buildFakeMic,
	buildLoopbackRow,
	createFakeListenSystem,
	instantSchedule,
} from './fake_listen_system';
import { ListenLevelNotAppliedError } from './listen_level_not_applied_error';
import { ListenSettings } from './listen_settings';
import { ListenSourceNotAvailableError } from './listen_source_not_available_error';

function readFixture(name: string): string {
	return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
}

function createFixtureRunner(): CommandRunner {
	return (commandOptions) => {
		const { args } = commandOptions;
		if (args.includes('sources')) {
			return Promise.resolve(readFixture('pactl_list_sources.json'));
		}
		if (args.includes('source-outputs')) {
			return Promise.resolve(readFixture('pactl_list_source_outputs.json'));
		}
		if (args.includes('sink-inputs')) {
			return Promise.resolve(readFixture('pactl_list_sink_inputs.json'));
		}
		return Promise.resolve(readFixture('pactl_list_short_modules.txt'));
	};
}

describe('createLinuxSourceListening', () => {
	describe('readState', () => {
		it('should read the hardware inputs and the loopback of a live capture, linked to the source its stream captures', async () => {
			const listening = createLinuxSourceListening({
				runCommand: createFixtureRunner(),
				schedule: instantSchedule,
			});

			const state = await listening.readState();

			expect(state.sources.map((source) => source.id)).toContain(FAKE_MIC);
			expect(state.loopbacks).toEqual([
				{
					moduleIndex: 536_870_916,
					requestedSourceId: FAKE_MIC,
					linkedSourceId: FAKE_MIC,
					captureLevel: 1,
					playbackLevel: 1,
					isPluginLoopback: false,
				},
			]);
		});

		it('should keep the requested source and the linked source apart, with the loudest level of each stream and the tag', async () => {
			const system = createFakeListenSystem({
				modules: [buildLoopbackRow(9, FAKE_VOLT, true)],
				captureStreams: [
					{ ownerModule: 9, sourceIndex: FAKE_MIC_INDEX, levels: [0.4, 0.2] },
				],
				playbackStreams: [
					{ ownerModule: 9, sourceIndex: 0, levels: [0.3, 0.7] },
				],
			});
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			const state = await listening.readState();

			expect(state.loopbacks).toEqual([
				{
					moduleIndex: 9,
					requestedSourceId: FAKE_VOLT,
					linkedSourceId: FAKE_MIC,
					captureLevel: 0.4,
					playbackLevel: 0.7,
					isPluginLoopback: true,
				},
			]);
		});

		it.each(['@DEFAULT_SOURCE@', String(FAKE_MIC_INDEX), 'unknown.source'])(
			'should leave the requested source undefined when the source= token is %s',
			async (token) => {
				const system = createFakeListenSystem({
					modules: [buildLoopbackRow(9, token)],
				});
				const listening = createLinuxSourceListening({
					runCommand: system.runCommand,
					schedule: instantSchedule,
				});

				const state = await listening.readState();

				expect(state.loopbacks[0]?.requestedSourceId).toBeUndefined();
			}
		);

		it('should leave the link and the levels undefined while the streams are missing', async () => {
			const system = createFakeListenSystem({
				modules: [buildLoopbackRow(9, FAKE_MIC)],
			});
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			const state = await listening.readState();

			expect(state.loopbacks).toEqual([
				{
					moduleIndex: 9,
					requestedSourceId: FAKE_MIC,
					linkedSourceId: undefined,
					captureLevel: undefined,
					playbackLevel: undefined,
					isPluginLoopback: false,
				},
			]);
		});

		it('should pass a timeout to every pactl call', async () => {
			const system = createFakeListenSystem();
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			await listening.readState();
			await listening.setLevel(FAKE_MIC, 0.05);

			expect(new Set(system.timeouts)).toEqual(
				new Set([ListenSettings.commandTimeoutMilliseconds])
			);
		});
	});

	describe('setLevel', () => {
		it('should set the volume of the source as a percent', async () => {
			const system = createFakeListenSystem();
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			await listening.setLevel(FAKE_MIC, 0.085);

			expect(system.writes()).toEqual([
				['set-source-volume', FAKE_MIC, '8.5%'],
			]);
		});

		it('should throw when the volume stays too high on read back', async () => {
			const system = createFakeListenSystem({ applyVolume: false });
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			await expect(listening.setLevel(FAKE_MIC, 0.05)).rejects.toBeInstanceOf(
				ListenLevelNotAppliedError
			);
		});

		it('should refuse a level that one channel at 100 % breaks even when the other is at the level', async () => {
			const system = createFakeListenSystem({
				applyVolume: false,
				sources: [buildFakeMic([1, 0.08])],
			});
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			await expect(listening.setLevel(FAKE_MIC, 0.08)).rejects.toBeInstanceOf(
				ListenLevelNotAppliedError
			);
		});

		it('should read back at most five times', async () => {
			const system = createFakeListenSystem({ applyVolume: false });
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});
			await listening.setLevel(FAKE_MIC, 0.05).catch(() => undefined);

			const sourceReads = system.calls.filter((args) =>
				args.includes('sources')
			);

			expect(sourceReads).toHaveLength(6);
		});

		it('should not set the volume of an id the listing does not hold', async () => {
			const system = createFakeListenSystem();
			const listening = createLinuxSourceListening({
				runCommand: system.runCommand,
				schedule: instantSchedule,
			});

			await expect(
				listening.setLevel('missing.source', 0.05)
			).rejects.toBeInstanceOf(ListenSourceNotAvailableError);
			expect(system.writes()).toEqual([]);
		});
	});
});
