import type { CommandRunner } from 'deck-kit/process/run_command';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { AudioDeviceNotFoundError } from '../audio/audio_device_not_found_error';
import { createLinuxCoreAudio } from './create_linux_core_audio';

const VOLT_SINK =
	'alsa_output.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo';
const VOLT_SOURCE =
	'alsa_input.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo';

function readFixtureText(name: string): string {
	return readFileSync(
		new URL(`./fixtures/${name}.json`, import.meta.url),
		'utf8'
	);
}

function createRunner() {
	const calls: Array<readonly string[]> = [];
	const runCommand: CommandRunner = (commandOptions) => {
		calls.push(commandOptions.args);
		const [, , verb, kind] = commandOptions.args;
		if (verb === 'info') {
			return Promise.resolve(readFixtureText('pactl_info'));
		}
		if (kind === 'sinks') {
			return Promise.resolve(readFixtureText('pactl_list_sinks'));
		}
		if (kind === 'sources') {
			return Promise.resolve(readFixtureText('pactl_list_sources'));
		}
		return Promise.resolve('');
	};
	return { runCommand: vi.fn(runCommand), calls };
}

function createRunnerWithCalls() {
	const { runCommand, calls } = createRunner();
	return { coreAudio: createLinuxCoreAudio({ runCommand }), calls };
}

function writesOf(calls: ReadonlyArray<readonly string[]>) {
	return calls.filter((args) => args[0] !== '-f');
}

describe('createLinuxCoreAudio', () => {
	it('reads a whole snapshot with three pactl calls', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		const snapshot = await coreAudio.readSnapshot();

		expect(calls).toHaveLength(3);
		expect(snapshot.devices).toHaveLength(4);
		expect(snapshot.defaultDeviceIds).toEqual({
			output: VOLT_SINK,
			input: VOLT_SOURCE,
		});
		expect(snapshot.volumes[VOLT_SINK]).toEqual({ level: 0.4, isMuted: false });
	});

	it('toggles the mute of a source in one set-source-mute call', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		await coreAudio.toggleMute(VOLT_SOURCE);

		expect(writesOf(calls)).toEqual([
			['set-source-mute', VOLT_SOURCE, 'toggle'],
		]);
	});

	it('sets the volume of a sink in whole percent', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		await coreAudio.setVolume(VOLT_SINK, 0.456);

		expect(writesOf(calls)).toEqual([['set-sink-volume', VOLT_SINK, '46%']]);
	});

	it('sets the mute and the default device with the command of their direction', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		await coreAudio.setMute(VOLT_SINK, true);
		await coreAudio.setDefaultDevice(VOLT_SOURCE);

		expect(writesOf(calls)).toEqual([
			['set-sink-mute', VOLT_SINK, '1'],
			['set-default-source', VOLT_SOURCE],
		]);
	});

	it('never passes pactl a device that is not in the listing', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		await expect(coreAudio.setVolume('--help', 0.5)).rejects.toBeInstanceOf(
			AudioDeviceNotFoundError
		);
		await expect(coreAudio.toggleMute('ghost')).rejects.toBeInstanceOf(
			AudioDeviceNotFoundError
		);

		expect(writesOf(calls)).toEqual([]);
	});

	it('changes a volume with one listing of its direction and one set call', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();
		await coreAudio.readSnapshot();
		calls.length = 0;

		await coreAudio.moveVolume(VOLT_SINK, 0.06);

		expect(calls).toEqual([
			['-f', 'json', 'list', 'sinks'],
			['set-sink-volume', VOLT_SINK, '46%'],
		]);
	});

	it('looks in both directions the first time it sees a device', async () => {
		const { coreAudio, calls } = createRunnerWithCalls();

		await coreAudio.moveVolume(VOLT_SOURCE, -0.1);

		expect(calls).toHaveLength(3);
		expect(writesOf(calls)).toEqual([
			['set-source-volume', VOLT_SOURCE, '90%'],
		]);
	});
});
