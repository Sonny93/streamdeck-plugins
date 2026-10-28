import type { AudioFlow } from './audio_flow';

/** The device an action works on: the default one of a direction, which follows Windows, or a fixed device. */
export type AudioTarget =
	| Readonly<{ kind: 'default'; flow: AudioFlow }>
	| Readonly<{ kind: 'device'; deviceId: string }>;
