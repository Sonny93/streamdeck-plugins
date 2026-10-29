import { streamDeck } from '@elgato/streamdeck';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';

import { InactivityMonitor } from './actions/inactivity_monitor';
import { LikeAction } from './actions/like_action';
import { LikeTargetStore } from './actions/like_target_store';
import { NextTrackAction } from './actions/next_track_action';
import { NowPlayingScreen } from './actions/now_playing_screen';
import { NowPlayingTiming } from './actions/now_playing_timing';
import { OpenSearchAction } from './actions/open_search_action';
import { PlayOnDeviceAction } from './actions/play_on_device_action';
import { PlayPauseAction } from './actions/play_pause_action';
import { PlayerStateHub } from './actions/player_state_hub';
import { PlaylistsDialAction } from './actions/playlists_dial_action';
import { PreviousTrackAction } from './actions/previous_track_action';
import { ShowSpotifyAction } from './actions/show_spotify_action';
import { ToggleFullscreenAction } from './actions/toggle_fullscreen_action';
import { ToggleLyricsAction } from './actions/toggle_lyrics_action';
import { UiStateHub } from './actions/ui_state_hub';
import { VolumeDialAction } from './actions/volume_dial_action';
import { windowsAudioMixer } from './audio/windows_audio_mixer';
import { fetchCoverDataUrl } from './spotify/fetch_cover_data_url';
import { fetchTrackLyrics } from './spotify/fetch_track_lyrics';
import { prepareSpotifyOnStartup } from './startup/prepare_spotify_on_startup';

const playerStateHub = new PlayerStateHub();
const likeTargetStore = new LikeTargetStore();
const uiStateHub = new UiStateHub();
const inactivity = new InactivityMonitor({
	delayMilliseconds: NowPlayingTiming.inactivityDelayMilliseconds,
	schedule: scheduleTimeout,
});
const nowPlaying = new NowPlayingScreen({
	inactivity,
	playerStateHub,
	fetchCover: fetchCoverDataUrl,
	fetchLyrics: fetchTrackLyrics,
	schedule: scheduleTimeout,
	now: Date.now,
	onError: (error) =>
		streamDeck.logger.debug('Cannot draw the now playing screen', error),
});

streamDeck.actions.registerAction(new OpenSearchAction(uiStateHub));
streamDeck.actions.registerAction(new ShowSpotifyAction(uiStateHub));
streamDeck.actions.registerAction(new ToggleLyricsAction(uiStateHub));
streamDeck.actions.registerAction(new ToggleFullscreenAction(uiStateHub));
streamDeck.actions.registerAction(new PlayPauseAction(playerStateHub));
streamDeck.actions.registerAction(new PlayOnDeviceAction(playerStateHub));
streamDeck.actions.registerAction(new PreviousTrackAction());
streamDeck.actions.registerAction(new NextTrackAction());
streamDeck.actions.registerAction(
	new PlaylistsDialAction(playerStateHub, likeTargetStore, nowPlaying)
);
streamDeck.actions.registerAction(
	new VolumeDialAction(windowsAudioMixer, nowPlaying)
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
