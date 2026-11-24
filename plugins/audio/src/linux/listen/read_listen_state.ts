import { runPactlJson } from 'deck-kit/linux/run_pactl_json';

import type { ListenState } from '../../listen/listen_state';
import { buildLoopbacks } from './build_loopbacks';
import type { ListenContext } from './listen_context';
import { parseListenSources } from './parse_listen_sources';
import { parseLoopbackModules } from './parse_loopback_modules';
import { parseModuleStreams } from './parse_module_streams';
import { parseSourceNamesByIndex } from './parse_source_names_by_index';

/** Reads the hardware inputs and every loaded loopback with its streams in one fresh, parallel read of the system. */
export async function readListenState(
	context: ListenContext
): Promise<ListenState> {
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
	return {
		sources: parseListenSources(sourcesJson),
		loopbacks: buildLoopbacks({
			modules: parseLoopbackModules(modulesText),
			captureStreams: parseModuleStreams(sourceOutputsJson),
			playbackStreams: parseModuleStreams(sinkInputsJson),
			sourceNamesByIndex: parseSourceNamesByIndex(sourcesJson),
		}),
	};
}
