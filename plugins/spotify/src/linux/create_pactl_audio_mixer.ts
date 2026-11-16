import { runPactlJson } from 'deck-kit/linux/run_pactl_json';
import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import type { AudioApp } from '../audio/audio_app';
import type { AudioMixer } from '../audio/audio_mixer';
import type { AudioSessionChange } from '../audio/audio_session_change';
import type { ForegroundApp } from '../audio/foreground_app';
import type { ForegroundReadOptions } from '../audio/foreground_read_options';
import { isSameImageName } from '../audio/is_same_image_name';
import { nodeProcFileSystem } from './node_proc_file_system';
import { parseClients } from './parse_clients';
import { parseSinkInputs } from './parse_sink_inputs';
import type { ProcFileSystem } from './proc_file_system';
import { readProcessAncestry } from './read_process_ancestry';
import type { SinkInput } from './sink_input';
import { summarizeSinkInputs } from './summarize_sink_inputs';

const PERCENT = 100;

type MixerOptions = Readonly<{
	readForegroundApp: (
		options?: ForegroundReadOptions
	) => Promise<ForegroundApp | undefined>;
	runCommand?: CommandRunner;
	procFileSystem?: ProcFileSystem;
}>;

function buildChangeCommands(
	sinkInput: SinkInput,
	change: AudioSessionChange
): string[][] {
	const commands: string[][] = [];
	if (change.volume !== undefined) {
		const percent = Math.round(change.volume * PERCENT);
		commands.push([
			'set-sink-input-volume',
			String(sinkInput.index),
			`${percent}%`,
		]);
	}
	if (change.isMuted !== undefined) {
		commands.push([
			'set-sink-input-mute',
			String(sinkInput.index),
			change.isMuted ? '1' : '0',
		]);
	}
	return commands;
}

/**
 * The OS mixer of PipeWire and PulseAudio, through pactl.
 * A change applies to every stream of the program in the current listing: only listed stream indexes reach pactl, never a saved value.
 */
export function createPactlAudioMixer(options: MixerOptions): AudioMixer {
	const run = options.runCommand ?? runCommand;
	const procFileSystem = options.procFileSystem ?? nodeProcFileSystem;
	const listSinkInputs = async (): Promise<SinkInput[]> => {
		const [rawSinkInputs, rawClients] = await Promise.all([
			runPactlJson({ args: ['list', 'sink-inputs'], runCommand: run }),
			runPactlJson({ args: ['list', 'clients'], runCommand: run }),
		]);
		return parseSinkInputs(rawSinkInputs, parseClients(rawClients));
	};
	const addAncestors = async (app: AudioApp): Promise<AudioApp> => {
		const ancestries = await Promise.all(
			(app.processIds ?? []).map((processId) =>
				readProcessAncestry({ procFileSystem, processId })
			)
		);
		return { ...app, processIds: [...new Set(ancestries.flat())] };
	};
	return {
		listApps: async () =>
			Promise.all(
				summarizeSinkInputs(await listSinkInputs()).map(addAncestors)
			),
		updateApp: async (imageName, change) => {
			const matching = (await listSinkInputs()).filter((sinkInput) =>
				isSameImageName(sinkInput.imageName, imageName)
			);
			await Promise.all(
				matching
					.flatMap((sinkInput) => buildChangeCommands(sinkInput, change))
					.map((args) => run({ command: 'pactl', args }))
			);
			return matching.length > 0;
		},
		readForegroundApp: options.readForegroundApp,
	};
}
