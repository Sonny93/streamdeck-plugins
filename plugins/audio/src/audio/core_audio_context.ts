import type { ComRuntime } from '../windows/com_runtime';
import type { NativePointer } from '../windows/native_pointer';
import type { CoreAudioPrototypes } from './core_audio_prototypes';

/** What the Core Audio bindings share: the COM plumbing, the method prototypes and the device enumerator, kept for the life of the plugin. */
export type CoreAudioContext = Readonly<{
	runtime: ComRuntime;
	prototypes: CoreAudioPrototypes;
	enumerator: NativePointer;
}>;
