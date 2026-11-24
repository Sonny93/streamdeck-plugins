import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import { LoopbackModuleIndexError } from './loopback_module_index_error';

const MODULE_INDEX_PATTERN = /^\d+$/u;
const CAPTURE_STREAM_PROPERTIES = `"node.dont-fallback=true state.restore-props=false ${ListenSettings.loopbackTag}"`;

/**
 * Loads a tagged loopback that captures the source and cannot be moved to another one, and returns the index of its module.
 * The double quotes are part of the argument: the module parser of pipewire-pulse reads them.
 */
export async function loadLoopback(
	context: ListenContext,
	sourceId: string
): Promise<number> {
	const output = await context.run({
		command: 'pactl',
		args: [
			'load-module',
			'module-loopback',
			`source=${sourceId}`,
			`latency_msec=${ListenSettings.loopbackLatencyMilliseconds}`,
			'source_dont_move=true',
			`source_output_properties=${CAPTURE_STREAM_PROPERTIES}`,
			'sink_input_properties="state.restore-props=false"',
		],
	});
	const text = output.trim();
	const moduleIndex = Number(text);
	if (!MODULE_INDEX_PATTERN.test(text) || !Number.isSafeInteger(moduleIndex)) {
		throw new LoopbackModuleIndexError();
	}
	return moduleIndex;
}
