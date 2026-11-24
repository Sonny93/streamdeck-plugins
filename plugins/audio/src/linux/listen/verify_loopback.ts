import { runPactlJson } from 'deck-kit/linux/run_pactl_json';

import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import {
	LoopbackNotVerifiedError,
	type LoopbackFailure,
} from './loopback_not_verified_error';
import { parseLoopbackModules } from './parse_loopback_modules';
import { parseModuleStreams, type ModuleStream } from './parse_module_streams';
import { parseSourceNamesByIndex } from './parse_source_names_by_index';
import { pollUntil } from './poll_until';

type Finding = Readonly<{ failure: LoopbackFailure; observed?: string }>;
type Inspection =
	| Readonly<{ state: 'done'; failure: Finding | undefined }>
	| Readonly<{ state: 'pending'; finding: Finding }>;

const DONE_OK: Inspection = { state: 'done', failure: undefined };
const NOT_SHOWN_FINDING: Finding = { failure: 'stream-missing' };
const NOT_SHOWN_YET: Inspection = {
	state: 'pending',
	finding: NOT_SHOWN_FINDING,
};

function fail(failure: LoopbackFailure, observed?: string): Inspection {
	return { state: 'done', failure: { failure, observed } };
}

function isAudibleSafely(level: number | undefined): boolean {
	return level !== undefined && level <= ListenSettings.maxStreamLevel;
}

function inspectCapture(
	capture: ModuleStream,
	names: ReadonlyMap<number, string>,
	sourceId: string
): Inspection {
	const linkedName =
		capture.sourceIndex === undefined
			? undefined
			: names.get(capture.sourceIndex);
	if (linkedName === undefined) {
		return {
			state: 'pending',
			finding: {
				failure: 'stream-unlinked',
				observed: `source index ${capture.sourceIndex ?? 'none'}`,
			},
		};
	}
	if (linkedName !== sourceId) {
		return fail('wrong-source', `linked to ${linkedName}`);
	}
	return isAudibleSafely(capture.loudestLevel)
		? DONE_OK
		: fail('capture-volume-too-high');
}

async function inspectLoopback(
	context: ListenContext,
	moduleIndex: number,
	sourceId: string
): Promise<Inspection> {
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
		return NOT_SHOWN_YET;
	}
	if (!loopbackModule.isPluginLoopback) {
		return fail('tag-missing');
	}
	const capture = parseModuleStreams(sourceOutputsJson).find(
		(stream) => stream.ownerModuleIndex === moduleIndex
	);
	if (capture === undefined) {
		return NOT_SHOWN_YET;
	}
	const captureInspection = inspectCapture(
		capture,
		parseSourceNamesByIndex(sourcesJson),
		sourceId
	);
	if (captureInspection !== DONE_OK) {
		return captureInspection;
	}
	const playback = parseModuleStreams(sinkInputsJson).find(
		(stream) => stream.ownerModuleIndex === moduleIndex
	);
	if (playback === undefined) {
		return NOT_SHOWN_YET;
	}
	return isAudibleSafely(playback.loudestLevel)
		? DONE_OK
		: fail('playback-volume-too-high');
}

/**
 * Checks that the loopback just loaded carries the tag of the plugin, that its capture stream is linked to the requested source
 * and that none of its streams is above 100 %. A stream that is not there or not linked yet is waited for, since the linking takes a moment;
 * a link to another known source fails at once. Throws `LoopbackNotVerifiedError` otherwise; the caller unloads the loopback.
 */
export async function verifyLoopback(
	context: ListenContext,
	moduleIndex: number,
	sourceId: string
): Promise<void> {
	let lastPending: Finding = NOT_SHOWN_FINDING;
	const finished = await pollUntil(
		context,
		async () => {
			const inspection = await inspectLoopback(context, moduleIndex, sourceId);
			if (inspection.state === 'pending') {
				lastPending = inspection.finding;
				return undefined;
			}
			return inspection;
		},
		{
			attempts: ListenSettings.verifyAttempts,
			delayMilliseconds: ListenSettings.verifyDelayMilliseconds,
		}
	);
	const finding = finished === undefined ? lastPending : finished.failure;
	if (finding !== undefined) {
		throw new LoopbackNotVerifiedError(finding.failure, finding.observed);
	}
}
