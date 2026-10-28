import { describe, expect, it } from 'vitest';

import { resolvePlaybackPosition } from './resolve_playback_position';
import type { SpotifyPlayingTrack } from '../spotify/spotify_playing_track';

const TRACK: SpotifyPlayingTrack = {
	title: 'A',
	artistNames: [],
	imageUrl: undefined,
	durationMilliseconds: 200_000,
	positionMilliseconds: 10_000,
	positionTimestamp: 1_000_000,
	playbackSpeed: 1,
};

describe('resolvePlaybackPosition', () => {
	it('should advance the position by the elapsed time while playing', () => {
		expect(
			resolvePlaybackPosition({
				track: TRACK,
				isPaused: false,
				now: 1_005_000,
			})
		).toBe(15_000);
	});

	it('should keep the measured position while paused', () => {
		expect(
			resolvePlaybackPosition({ track: TRACK, isPaused: true, now: 1_005_000 })
		).toBe(10_000);
	});

	it('should advance at the playback speed', () => {
		expect(
			resolvePlaybackPosition({
				track: { ...TRACK, playbackSpeed: 1.5 },
				isPaused: false,
				now: 1_004_000,
			})
		).toBe(16_000);
	});

	it('should not go past the end of the track', () => {
		expect(
			resolvePlaybackPosition({
				track: TRACK,
				isPaused: false,
				now: 9_000_000,
			})
		).toBe(200_000);
	});

	it('should not go before the start of the track', () => {
		expect(
			resolvePlaybackPosition({ track: TRACK, isPaused: false, now: 0 })
		).toBe(0);
	});

	it('should not cap the position of a track without known duration', () => {
		expect(
			resolvePlaybackPosition({
				track: { ...TRACK, durationMilliseconds: 0 },
				isPaused: false,
				now: 1_005_000,
			})
		).toBe(15_000);
	});
});
