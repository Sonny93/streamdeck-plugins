import { streamDeck } from '@elgato/streamdeck';

import { NextTrackAction } from './actions/next_track_action';
import { PlayPauseAction } from './actions/play_pause_action';
import { OpenSearchAction } from './actions/open_search_action';
import { ToggleLyricsAction } from './actions/toggle_lyrics_action';
import { PreviousTrackAction } from './actions/previous_track_action';
import { ToggleFullscreenAction } from './actions/toggle_fullscreen_action';
import { prepareSpotifyOnStartup } from './startup/prepare_spotify_on_startup';

streamDeck.actions.registerAction(new OpenSearchAction());
streamDeck.actions.registerAction(new ToggleLyricsAction());
streamDeck.actions.registerAction(new ToggleFullscreenAction());
streamDeck.actions.registerAction(new PlayPauseAction());
streamDeck.actions.registerAction(new PreviousTrackAction());
streamDeck.actions.registerAction(new NextTrackAction());

void streamDeck.connect();
void prepareSpotifyOnStartup();
