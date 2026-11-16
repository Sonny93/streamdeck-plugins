import { describe, expect, it, vi } from 'vitest';

import type { VoltStatus } from '../../volt/volt_status';
import type { AudioPanelSources } from './audio_panel_sources';
import { buildAudioSnapshotForTest } from './build_audio_snapshot_for_test';
import { createAudioPanelFeed } from './create_audio_panel_feed';

function createSources(overrides: Partial<AudioPanelSources> = {}) {
	const stops = [vi.fn(), vi.fn(), vi.fn()];
	const subscribes = stops.map((stop) => vi.fn(() => stop));
	const voltStatus: VoltStatus = { kind: 'disconnected' };
	const sources: AudioPanelSources = {
		audioHub: { current: undefined, subscribe: subscribes[0]! },
		voltHub: { current: voltStatus, subscribe: subscribes[1]! },
		languageStore: { current: 'fr', subscribe: subscribes[2]! },
		...overrides,
	};
	return { sources, stops, subscribes };
}

describe('createAudioPanelFeed', () => {
	it('should be available without a snapshot, so the panel never hides', () => {
		const { sources } = createSources();

		expect(createAudioPanelFeed(sources).isAvailable()).toBe(true);
	});

	it('should listen to the audio devices, the Volt 1 and the language, and stop listening together', () => {
		const { sources, stops, subscribes } = createSources();
		const listener = vi.fn();

		const unsubscribe = createAudioPanelFeed(sources).subscribe(listener);
		unsubscribe();

		for (const subscribe of subscribes) {
			expect(subscribe).toHaveBeenCalledWith(listener);
		}
		for (const stop of stops) {
			expect(stop).toHaveBeenCalledTimes(1);
		}
	});

	it('should build a slice from what the hubs currently hold, in the current language', async () => {
		const snapshot = await buildAudioSnapshotForTest([
			{
				device: { id: 'speakers', name: 'Speakers', flow: 'output' },
				volume: { level: 0.5, isMuted: true },
			},
		]);
		const { sources } = createSources({
			audioHub: { current: snapshot, subscribe: vi.fn(() => vi.fn()) },
		});
		const feed = createAudioPanelFeed(sources);

		expect(feed.buildSlice(0)).toContain('>Muet<');
		expect(feed.buildSlice(2)).toContain('>Non connectée<');
	});
});
