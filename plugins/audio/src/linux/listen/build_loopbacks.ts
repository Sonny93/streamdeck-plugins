import type { Loopback } from '../../listen/loopback';
import type { LoopbackModule } from './parse_loopback_modules';
import type { ModuleStream } from './parse_module_streams';

function findOwnedStream(
	streams: readonly ModuleStream[],
	moduleIndex: number
): ModuleStream | undefined {
	return streams.find((stream) => stream.ownerModuleIndex === moduleIndex);
}

/** A `source=` token only counts when it is the node name of a listed source, not `@DEFAULT_SOURCE@`, an index or an unknown value. */
function isKnownSourceName(
	token: string | undefined,
	sourceNamesByIndex: ReadonlyMap<number, string>
): token is string {
	return (
		token !== undefined && [...sourceNamesByIndex.values()].includes(token)
	);
}

/** Joins each loopback module with the capture and playback streams it owns. */
export function buildLoopbacks(
	input: Readonly<{
		modules: readonly LoopbackModule[];
		captureStreams: readonly ModuleStream[];
		playbackStreams: readonly ModuleStream[];
		sourceNamesByIndex: ReadonlyMap<number, string>;
	}>
): Loopback[] {
	return input.modules.map((loopbackModule) => {
		const capture = findOwnedStream(
			input.captureStreams,
			loopbackModule.moduleIndex
		);
		const playback = findOwnedStream(
			input.playbackStreams,
			loopbackModule.moduleIndex
		);
		return {
			moduleIndex: loopbackModule.moduleIndex,
			requestedSourceId: isKnownSourceName(
				loopbackModule.requestedSourceId,
				input.sourceNamesByIndex
			)
				? loopbackModule.requestedSourceId
				: undefined,
			linkedSourceId:
				capture?.sourceIndex === undefined
					? undefined
					: input.sourceNamesByIndex.get(capture.sourceIndex),
			captureLevel: capture?.loudestLevel,
			playbackLevel: playback?.loudestLevel,
			isPluginLoopback: loopbackModule.isPluginLoopback,
		};
	});
}
