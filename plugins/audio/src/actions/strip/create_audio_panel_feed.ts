import type { IdlePanelOptions } from 'deck-kit/strip/idle_panel_options';

import type { AudioPanelSources } from './audio_panel_sources';
import { buildAudioPanelSvg } from './build_audio_panel_svg';

/**
 * The parts of the idle panel options that come from the plugin: the panel is always available once a dial exists
 * (a missing snapshot draws a message), it draws again when the audio devices, the Volt 1 or the language change,
 * and it builds each slice from what the hubs already publish, with no read of its own.
 */
export function createAudioPanelFeed(
	sources: AudioPanelSources
): Pick<IdlePanelOptions, 'isAvailable' | 'subscribe' | 'buildSlice'> {
	return {
		isAvailable: () => true,
		subscribe: (listener) => {
			const stops = [
				sources.audioHub.subscribe(listener),
				sources.voltHub.subscribe(listener),
				sources.languageStore.subscribe(listener),
			];
			return () => {
				for (const stop of stops) {
					stop();
				}
			};
		},
		buildSlice: (column) =>
			buildAudioPanelSvg({
				snapshot: sources.audioHub.current,
				voltStatus: sources.voltHub.current,
				language: sources.languageStore.current,
				column,
			}),
	};
}
