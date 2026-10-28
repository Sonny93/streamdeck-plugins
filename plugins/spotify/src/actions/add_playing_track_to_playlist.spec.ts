import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addCurrentTrackToLikeTarget } from '../spotify/add_current_track_to_like_target';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { addPlayingTrackToPlaylist } from './add_playing_track_to_playlist';
import { runSpotifyAction } from './run_spotify_action';

const ADD_COMMAND = vi.hoisted(() => vi.fn());

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { error: vi.fn() } },
}));
vi.mock('./run_spotify_action');
vi.mock('../spotify/add_current_track_to_like_target');

const ADDABLE: SpotifyPlaylist = {
	uri: 'spotify:playlist:a',
	name: 'Road trip',
	imageUrl: undefined,
	kind: 'playlist',
	canAdd: true,
};

function build(
	overrides: Partial<Parameters<typeof addPlayingTrackToPlaylist>[0]> = {}
) {
	const action = {
		manifestId: 'dial',
		showAlert: vi.fn(() => Promise.resolve()),
	};
	const likeTargetStore = { set: vi.fn(() => Promise.resolve()) };
	return {
		action,
		likeTargetStore,
		run: () =>
			addPlayingTrackToPlaylist({
				action,
				hold: false,
				playlist: ADDABLE,
				likeTargetStore,
				...overrides,
			}),
	};
}

describe('addPlayingTrackToPlaylist', () => {
	beforeEach(() => {
		vi.mocked(runSpotifyAction).mockReset().mockResolvedValue(true);
		vi.mocked(addCurrentTrackToLikeTarget)
			.mockReset()
			.mockReturnValue(ADD_COMMAND);
	});

	it('should add the playing track to the playlist', async () => {
		const { run, action } = build();

		await run();

		expect(addCurrentTrackToLikeTarget).toHaveBeenCalledWith({
			uri: 'spotify:playlist:a',
			kind: 'playlist',
		});
		expect(runSpotifyAction).toHaveBeenCalledWith(action, ADD_COMMAND);
	});

	it('should make the playlist the like target and report the track as added', async () => {
		const { run, likeTargetStore } = build();

		expect(await run()).toBe(true);
		expect(likeTargetStore.set).toHaveBeenCalledWith({
			uri: 'spotify:playlist:a',
			name: 'Road trip',
			kind: 'playlist',
		});
	});

	it('should report the track as added even when the like target cannot be saved', async () => {
		const { run, likeTargetStore } = build();
		likeTargetStore.set.mockRejectedValue(new Error('no settings'));

		expect(await run()).toBe(true);
	});

	it('should leave the like target alone when the add fails', async () => {
		vi.mocked(runSpotifyAction).mockResolvedValue(false);
		const { run, likeTargetStore } = build();

		expect(await run()).toBe(false);
		expect(likeTargetStore.set).not.toHaveBeenCalled();
	});

	it('should alert and send nothing for a playlist that cannot be added to', async () => {
		const { run, action, likeTargetStore } = build({
			playlist: { ...ADDABLE, canAdd: false },
		});

		expect(await run()).toBe(false);
		expect(action.showAlert).toHaveBeenCalledTimes(1);
		expect(runSpotifyAction).not.toHaveBeenCalled();
		expect(likeTargetStore.set).not.toHaveBeenCalled();
	});

	it('should alert and send nothing when there is no playlist', async () => {
		const { run, action } = build({ playlist: undefined });

		await run();

		expect(action.showAlert).toHaveBeenCalledTimes(1);
		expect(runSpotifyAction).not.toHaveBeenCalled();
	});

	it('should ignore a hold', async () => {
		const { run, action, likeTargetStore } = build({ hold: true });

		expect(await run()).toBe(false);
		expect(action.showAlert).not.toHaveBeenCalled();
		expect(runSpotifyAction).not.toHaveBeenCalled();
		expect(likeTargetStore.set).not.toHaveBeenCalled();
	});
});
