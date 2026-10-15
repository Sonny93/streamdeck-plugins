import { streamDeck } from '@elgato/streamdeck';

import { LikeAction } from './actions/like_action';
import { PlayerStateHub } from './actions/player_state_hub';
import { scheduleTimeout } from './actions/schedule_timeout';
import { NextTrackAction } from './actions/next_track_action';
import { LikeTargetStore } from './actions/like_target_store';
import { PlayPauseAction } from './actions/play_pause_action';
import { NowPlayingTiming } from './actions/now_playing_timing';
import { OpenSearchAction } from './actions/open_search_action';
import { NowPlayingScreen } from './actions/now_playing_screen';
import { InactivityMonitor } from './actions/inactivity_monitor';
import { fetchCoverDataUrl } from './spotify/fetch_cover_data_url';
import { ToggleLyricsAction } from './actions/toggle_lyrics_action';
import { PreviousTrackAction } from './actions/previous_track_action';
import { PlaylistsDialAction } from './actions/playlists_dial_action';
import { ToggleFullscreenAction } from './actions/toggle_fullscreen_action';
import { prepareSpotifyOnStartup } from './startup/prepare_spotify_on_startup';

const playerStateHub = new PlayerStateHub();
const likeTargetStore = new LikeTargetStore();
const inactivity = new InactivityMonitor({
	delayMilliseconds: NowPlayingTiming.inactivityDelayMilliseconds,
	schedule: scheduleTimeout,
});
const nowPlaying = new NowPlayingScreen({
	inactivity,
	playerStateHub,
	fetchCover: fetchCoverDataUrl,
	schedule: scheduleTimeout,
	now: Date.now,
	onError: (error) =>
		streamDeck.logger.debug('Cannot draw the now playing screen', error),
});

streamDeck.actions.registerAction(new OpenSearchAction());
streamDeck.actions.registerAction(new ToggleLyricsAction());
streamDeck.actions.registerAction(new ToggleFullscreenAction());
streamDeck.actions.registerAction(new PlayPauseAction(playerStateHub));
streamDeck.actions.registerAction(new PreviousTrackAction());
streamDeck.actions.registerAction(new NextTrackAction());
streamDeck.actions.registerAction(
	new PlaylistsDialAction(playerStateHub, likeTargetStore, nowPlaying)
);
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
