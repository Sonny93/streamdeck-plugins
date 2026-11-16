import { runPactlJson } from 'deck-kit/linux/run_pactl_json';
import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import { AudioDeviceNotFoundError } from '../audio/audio_device_not_found_error';
import type { AudioFlow } from '../audio/audio_flow';
import type { AudioSnapshot } from '../audio/audio_snapshot';
import type { AudioVolume } from '../audio/audio_volume';
import type { CoreAudio } from '../audio/core_audio';
import type { LinuxAudioEntry } from './linux_audio_entry';
import { parsePactlDefaults } from './parse_pactl_defaults';
import { parsePactlDevices } from './parse_pactl_devices';

const PERCENT_SCALE = 100;
const LISTING_COMMANDS = { output: 'sinks', input: 'sources' } as const;
const COMMAND_SUFFIXES = { output: 'sink', input: 'source' } as const;

function toPercentArgument(level: number): string {
	return `${Math.round(Math.min(1, Math.max(0, level)) * PERCENT_SCALE)}%`;
}

/**
 * The system audio of Linux through `pactl` (PipeWire with pipewire-pulse, or PulseAudio).
 * A device id is the node name of the listing; a write only passes `pactl` a name found in a fresh listing, never a stored one.
 */
export function createLinuxCoreAudio(
	options: Readonly<{ runCommand?: CommandRunner }> = {}
): CoreAudio {
	const run = options.runCommand ?? runCommand;

	const flowById = new Map<string, AudioFlow>();

	const listEntries = async (flow: AudioFlow): Promise<LinuxAudioEntry[]> => {
		const entries = parsePactlDevices(
			await runPactlJson({
				args: ['list', LISTING_COMMANDS[flow]],
				runCommand: run,
			}),
			flow
		);
		for (const { device } of entries) {
			flowById.set(device.id, flow);
		}
		return entries;
	};

	const readDefaults = async (): Promise<
		Record<AudioFlow, string | undefined>
	> =>
		parsePactlDefaults(await runPactlJson({ args: ['info'], runCommand: run }));

	const findInListing = async (
		deviceId: string,
		flows: readonly AudioFlow[]
	): Promise<LinuxAudioEntry | undefined> => {
		const listings = await Promise.all(flows.map((flow) => listEntries(flow)));
		return listings
			.flat()
			.find((candidate) => candidate.device.id === deviceId);
	};

	/** Looks the device up in a fresh listing of the direction it had last time, and of both when it is new or moved. */
	const findEntry = async (deviceId: string): Promise<LinuxAudioEntry> => {
		const hintedFlow = flowById.get(deviceId);
		const hinted =
			hintedFlow === undefined
				? undefined
				: await findInListing(deviceId, [hintedFlow]);
		const entry =
			hinted ?? (await findInListing(deviceId, ['output', 'input']));
		if (entry === undefined) {
			throw new AudioDeviceNotFoundError(deviceId);
		}
		return entry;
	};

	const runPactl = async (args: readonly string[]): Promise<void> => {
		await run({ command: 'pactl', args });
	};

	const runOnDevice = async (
		deviceId: string,
		action: 'volume' | 'mute',
		value: string
	): Promise<void> => {
		const { device } = await findEntry(deviceId);
		await runPactl([
			`set-${COMMAND_SUFFIXES[device.flow]}-${action}`,
			device.id,
			value,
		]);
	};

	return {
		readSnapshot: async (): Promise<AudioSnapshot> => {
			const [outputs, inputs, defaultDeviceIds] = await Promise.all([
				listEntries('output'),
				listEntries('input'),
				readDefaults(),
			]);
			const entries = [...outputs, ...inputs];
			return {
				devices: entries.map((entry) => entry.device),
				defaultDeviceIds,
				volumes: Object.fromEntries(
					entries.map((entry) => [entry.device.id, entry.volume])
				),
			};
		},
		listDevices: async (flow) =>
			(await listEntries(flow)).map((entry) => entry.device),
		readDefaultDeviceId: async (flow) => (await readDefaults())[flow],
		readVolume: async (deviceId): Promise<AudioVolume> =>
			(await findEntry(deviceId)).volume,
		setVolume: (deviceId, level) =>
			runOnDevice(deviceId, 'volume', toPercentArgument(level)),
		moveVolume: async (deviceId, delta) => {
			const { device, volume } = await findEntry(deviceId);
			await runPactl([
				`set-${COMMAND_SUFFIXES[device.flow]}-volume`,
				device.id,
				toPercentArgument(volume.level + delta),
			]);
			if (volume.isMuted) {
				await runPactl([
					`set-${COMMAND_SUFFIXES[device.flow]}-mute`,
					device.id,
					'0',
				]);
			}
		},
		setMute: (deviceId, isMuted) =>
			runOnDevice(deviceId, 'mute', isMuted ? '1' : '0'),
		toggleMute: (deviceId) => runOnDevice(deviceId, 'mute', 'toggle'),
		setDefaultDevice: async (deviceId) => {
			const { device } = await findEntry(deviceId);
			await runPactl([
				`set-default-${COMMAND_SUFFIXES[device.flow]}`,
				device.id,
			]);
		},
	};
}
