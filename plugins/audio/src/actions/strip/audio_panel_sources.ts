import type { LanguageStore } from 'deck-kit/i18n/language_store';

import type { AudioHub } from '../../audio/audio_hub';
import type { VoltHub } from '../../volt/volt_hub';

/**
 * What the idle panel reads, and nothing more: the members of each hub that report a state.
 * The Volt 1 hub is typed down to its reading members, so the panel cannot reach `toggleButton`, nor any other write to the device.
 */
export type AudioPanelSources = Readonly<{
	audioHub: Pick<AudioHub, 'current' | 'subscribe'>;
	voltHub: Pick<VoltHub, 'current' | 'subscribe'>;
	languageStore: Pick<LanguageStore, 'current' | 'subscribe'>;
}>;
