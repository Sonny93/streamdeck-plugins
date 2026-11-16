import type { AudioApp } from '../audio/audio_app';
import { isSameImageName } from '../audio/is_same_image_name';
import type { SinkInput } from './sink_input';

function listProcessIds(
	known: readonly number[],
	sinkInput: SinkInput
): number[] {
	const { processId } = sinkInput;
	return processId === undefined || known.includes(processId)
		? [...known]
		: [...known, processId];
}

/**
 * Groups the streams by program (ignoring case and `.exe`), one app per program, sorted by readable name.
 * A program with several streams shows its loudest volume and counts as muted only when all are; it lists the process of each stream.
 */
export function summarizeSinkInputs(
	sinkInputs: readonly SinkInput[]
): AudioApp[] {
	const apps: AudioApp[] = [];
	for (const sinkInput of sinkInputs) {
		const position = apps.findIndex((app) =>
			isSameImageName(app.imageName, sinkInput.imageName)
		);
		const known = apps[position];
		if (known === undefined) {
			apps.push({
				imageName: sinkInput.imageName,
				displayName: sinkInput.displayName,
				volume: sinkInput.volume,
				isMuted: sinkInput.isMuted,
				processIds: listProcessIds([], sinkInput),
			});
			continue;
		}
		apps[position] = {
			...known,
			volume: Math.max(known.volume, sinkInput.volume),
			isMuted: known.isMuted && sinkInput.isMuted,
			processIds: listProcessIds(known.processIds ?? [], sinkInput),
		};
	}
	return apps.sort((first, second) =>
		first.displayName.localeCompare(second.displayName)
	);
}
