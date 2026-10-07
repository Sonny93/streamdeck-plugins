import { streamDeck } from '@elgato/streamdeck';

import { LikeAction } from './actions/like_action';
import { PlayerStateHub } from './actions/player_state_hub';
import { NextTrackAction } from './actions/next_track_action';
import { LikeTargetStore } from './actions/like_target_store';
import { PlayPauseAction } from './actions/play_pause_action';
import { OpenSearchAction } from './actions/open_search_action';
import { ToggleLyricsAction } from './actions/toggle_lyrics_action';
import { PreviousTrackAction } from './actions/previous_track_action';
import { PlaylistsDialAction } from './actions/playlists_dial_action';
import { ToggleFullscreenAction } from './actions/toggle_fullscreen_action';
import { prepareSpotifyOnStartup } from './startup/prepare_spotify_on_startup';

const playerStateHub = new PlayerStateHub();
const likeTargetStore = new LikeTargetStore();

streamDeck.actions.registerAction(new OpenSearchAction());
streamDeck.actions.registerAction(new ToggleLyricsAction());
streamDeck.actions.registerAction(new ToggleFullscreenAction());
streamDeck.actions.registerAction(new PlayPauseAction(playerStateHub));
streamDeck.actions.registerAction(new PreviousTrackAction());
streamDeck.actions.registerAction(new NextTrackAction());
streamDeck.actions.registerAction(new PlaylistsDialAction(likeTargetStore));
streamDeck.actions.registerAction(
	new LikeAction(playerStateHub, likeTargetStore)
);

void streamDeck.connect();
void likeTargetStore
	.load()
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the like target', error)
	);
void prepareSpotifyOnStartup();
