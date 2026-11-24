import type { ListenSource } from './listen_source';

export const REAR_MIC_ID = 'alsa_input.rear_mic';
export const REAR_MIC_PORT = 'analog-input-rear-mic';

/** A hardware input of tests: the rear mic at 8 %, unless overridden. */
export function buildListenSource(
	overrides: Partial<ListenSource> = {}
): ListenSource {
	return {
		id: REAR_MIC_ID,
		name: 'Rear Mic',
		loudestLevel: 0.08,
		isMuted: false,
		activePort: REAR_MIC_PORT,
		...overrides,
	};
}
