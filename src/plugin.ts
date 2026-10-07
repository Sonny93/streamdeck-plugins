import { streamDeck } from '@elgato/streamdeck';

import { OpenSearchAction } from './actions/open_search_action';
import { ToggleLyricsAction } from './actions/toggle_lyrics_action';
import { ToggleFullscreenAction } from './actions/toggle_fullscreen_action';

streamDeck.actions.registerAction(new OpenSearchAction());
streamDeck.actions.registerAction(new ToggleLyricsAction());
streamDeck.actions.registerAction(new ToggleFullscreenAction());

void streamDeck.connect();
