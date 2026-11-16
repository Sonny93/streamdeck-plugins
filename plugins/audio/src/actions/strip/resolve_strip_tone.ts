import type { AudioStripModel } from './audio_strip_model';
import type { StripTone } from './strip_tone';

/** The tone of the strips: amber while any of the devices is live (found and not muted), neutral when all are muted or missing. */
export function resolveStripTone(
	models: readonly AudioStripModel[]
): StripTone {
	return models.some((model) => model.percent !== undefined && !model.isMuted)
		? 'amber'
		: 'neutral';
}
