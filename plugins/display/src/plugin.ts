import { streamDeck } from '@elgato/streamdeck';
import { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
import { LanguageStore } from 'deck-kit/i18n/language_store';
import { readSystemLocale } from 'deck-kit/i18n/read_system_locale';
import { IdlePanel } from 'deck-kit/strip/idle_panel';
import { IdleTiming } from 'deck-kit/strip/idle_timing';

import { BrightnessDialAction } from './actions/display/brightness_dial_action';
import { BrightnessKeyAction } from './actions/display/brightness_key_action';
import { HdrKeyAction } from './actions/display/hdr_key_action';
import { ScreenPowerKeyAction } from './actions/display/screen_power_key_action';
import { buildDisplayPanelSvg } from './actions/strip/build_display_panel_svg';
import { DisplayHub } from './displays/display_hub';
import { DisplayTiming } from './displays/display_timing';
import { createPlatformDisplaySystemLoader } from './platform/create_platform_display_system_loader';
import { streamDeckGlobalSettings } from './settings/stream_deck_global_settings';

const displayHub = new DisplayHub({
	loadDisplaySystem: createPlatformDisplaySystemLoader({
		platform: process.platform,
		schedule: scheduleTimeout,
	}),
	schedule: scheduleTimeout,
	pollIntervalMilliseconds: DisplayTiming.pollIntervalMilliseconds,
	onError: (error) => streamDeck.logger.warn('Cannot read the monitors', error),
});

const languageStore = new LanguageStore({
	settings: streamDeckGlobalSettings,
	readSystemLocale: () =>
		readSystemLocale({
			environment: process.env,
			readIntlLocale: () => Intl.DateTimeFormat().resolvedOptions().locale,
		}),
	onError: (error) =>
		streamDeck.logger.warn('Cannot draw again after a language change', error),
});

const idlePanel = new IdlePanel({
	inactivity: new InactivityMonitor({
		delayMilliseconds: IdleTiming.inactivityDelayMilliseconds,
		schedule: scheduleTimeout,
	}),
	schedule: scheduleTimeout,
	isAvailable: () => true,
	subscribe: (listener) => {
		const stops = [
			displayHub.subscribe(listener),
			languageStore.subscribe(listener),
		];
		return () => {
			for (const stop of stops) {
				stop();
			}
		};
	},
	buildSlice: (column) =>
		buildDisplayPanelSvg(displayHub.current, languageStore.current, column),
	onError: (error) =>
		streamDeck.logger.warn('Cannot draw the idle panel', error),
});

streamDeck.actions.registerAction(
	new ScreenPowerKeyAction(displayHub, languageStore)
);
streamDeck.actions.registerAction(
	new BrightnessKeyAction(displayHub, languageStore)
);
streamDeck.actions.registerAction(
	new BrightnessDialAction(displayHub, languageStore, idlePanel)
);
streamDeck.actions.registerAction(new HdrKeyAction(displayHub, languageStore));

void streamDeck.connect();
void languageStore
	.load()
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the language', error)
	);
