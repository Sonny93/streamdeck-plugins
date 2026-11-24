import { runPactlJson } from 'deck-kit/linux/run_pactl_json';

import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import {
	LoopbackNotVerifiedError,
	type LoopbackFailure,
} from './loopback_not_verified_error';
import { parseLoopbackModules } from './parse_loopback_modules';
import { parseModuleStreams } from './parse_module_streams';
import { parseSourceNamesByIndex } from './parse_source_names_by_index';
import { pollUntil } from './poll_until';

type Verdict = 'ok' | LoopbackFailure;

function isAudibleSafely(level: number | undefined): boolean {
	return level !== undefined && level <= ListenSettings.maxStreamLevel;
}

async function inspectLoopback(
	context: ListenContext,
	moduleIndex: number,
	sourceId: string
): Promise<Verdict | undefined> {
	const [sourcesJson, sourceOutputsJson, sinkInputsJson, modulesText] =
		await Promise.all([
			runPactlJson({ args: ['list', 'sources'], runCommand: context.run }),
			runPactlJson({
				args: ['list', 'source-outputs'],
				runCommand: context.run,
			}),
			runPactlJson({ args: ['list', 'sink-inputs'], runCommand: context.run }),
			context.run({ command: 'pactl', args: ['list', 'short', 'modules'] }),
		]);
	const loopbackModule = parseLoopbackModules(modulesText).find(
		(candidate) => candidate.moduleIndex === moduleIndex
	);
	if (loopbackModule === undefined) {
		return undefined;
	}
	if (!loopbackModule.isPluginLoopback) {
		return 'tag-missing';
	}
	const capture = parseModuleStreams(sourceOutputsJson).find(
		(stream) => stream.ownerModuleIndex === moduleIndex
	);
	if (capture === undefined) {
		return undefined;
	}
	const names = parseSourceNamesByIndex(sourcesJson);
	const linkedName =
		capture.sourceIndex === undefined
			? undefined
			: names.get(capture.sourceIndex);
	if (linkedName !== sourceId) {
		return 'wrong-source';
	}
	if (!isAudibleSafely(capture.loudestLevel)) {
		return 'capture-volume-too-high';
	}
	const playback = parseModuleStreams(sinkInputsJson).find(
		(stream) => stream.ownerModuleIndex === moduleIndex
	);
	if (playback === undefined) {
		return undefined;
	}
	return isAudibleSafely(playback.loudestLevel)
		? 'ok'
		: 'playback-volume-too-high';
}

/**
 * Checks that the loopback just loaded carries the tag of the plugin, captures the requested source and that none of its streams is above 100 %.
 * Throws `LoopbackNotVerifiedError` otherwise, also when its streams never show up; the caller unloads it.
 */
export async function verifyLoopback(
	context: ListenContext,
	moduleIndex: number,
	sourceId: string
): Promise<void> {
	const verdict = await pollUntil(context, () =>
		inspectLoopback(context, moduleIndex, sourceId)
	);
	if (verdict !== 'ok') {
		throw new LoopbackNotVerifiedError(verdict ?? 'stream-missing');
	}
}
