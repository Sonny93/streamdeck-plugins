import { streamDeck } from '@elgato/streamdeck';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';

import { BrightnessDialAction } from './actions/display/brightness_dial_action';
import { BrightnessKeyAction } from './actions/display/brightness_key_action';
import { HdrKeyAction } from './actions/display/hdr_key_action';
import { ScreenPowerKeyAction } from './actions/display/screen_power_key_action';
import { DisplayHub } from './displays/display_hub';
import { DisplayTiming } from './displays/display_timing';
import { createDisplaySystemLoader } from './displays/load_display_system';

const displayHub = new DisplayHub({
	loadDisplaySystem: createDisplaySystemLoader(scheduleTimeout),
	schedule: scheduleTimeout,
	pollIntervalMilliseconds: DisplayTiming.pollIntervalMilliseconds,
	onError: (error) => streamDeck.logger.warn('Cannot read the monitors', error),
});

streamDeck.actions.registerAction(new ScreenPowerKeyAction(displayHub));
streamDeck.actions.registerAction(new BrightnessKeyAction(displayHub));
streamDeck.actions.registerAction(new BrightnessDialAction(displayHub));
streamDeck.actions.registerAction(new HdrKeyAction(displayHub));

void streamDeck.connect();
