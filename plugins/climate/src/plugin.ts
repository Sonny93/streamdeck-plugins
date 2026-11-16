import { streamDeck } from '@elgato/streamdeck';
import { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
import { LanguageStore } from 'deck-kit/i18n/language_store';
import { readSystemLocale } from 'deck-kit/i18n/read_system_locale';
import { IdleTiming } from 'deck-kit/strip/idle_timing';

import { ClimateDialAction } from './actions/dial/climate_dial_action';
import { EnergyDialAction } from './actions/energy/energy_dial_action';
import { FanKeyAction } from './actions/fan/fan_key_action';
import { FanDialAction } from './actions/fan_dial/fan_dial_action';
import { InfoDialAction } from './actions/info/info_dial_action';
import { PowerKeyAction } from './actions/power/power_key_action';
import { PresetKeyAction } from './actions/preset/preset_key_action';
import { SpecialModeKeyAction } from './actions/special_mode/special_mode_key_action';
import { ClimateHub } from './climate/climate_hub';
import { ClimateTiming } from './climate/climate_timing';
import { createLocalHttpDriver } from './daikin/local/create_local_http_driver';
import type { UnitDriver } from './daikin/unit_driver';
import { createIdleDashboard } from './idle/create_idle_dashboard';
import { InspectorPanel } from './inspector/inspector_panel';
import { streamDeckGlobalSettings } from './settings/stream_deck_global_settings';
import { saveUnitAddress } from './unit_address/save_unit_address';
import { UnitAddressStore } from './unit_address/unit_address_store';

function createDriver(host: string): UnitDriver {
	return createLocalHttpDriver({ host });
}

const climateHub = new ClimateHub({
	createDriver,
	schedule: scheduleTimeout,
	pollIntervalMilliseconds: ClimateTiming.pollIntervalMilliseconds,
	maximumPollIntervalMilliseconds:
		ClimateTiming.maximumPollIntervalMilliseconds,
	energyIntervalMilliseconds: ClimateTiming.energyIntervalMilliseconds,
	energyRetryMilliseconds: ClimateTiming.energyRetryMilliseconds,
	now: Date.now,
	onError: (error) =>
		streamDeck.logger.warn('Cannot reach the air conditioner', error),
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

const idleDashboard = createIdleDashboard({
	inactivity: new InactivityMonitor({
		delayMilliseconds: IdleTiming.inactivityDelayMilliseconds,
		schedule: scheduleTimeout,
	}),
	schedule: scheduleTimeout,
	hub: climateHub,
	languageStore,
	onError: (error) =>
		streamDeck.logger.warn('Cannot draw the idle dashboard', error),
});

const unitAddressStore = new UnitAddressStore();

const inspectorPanel = new InspectorPanel({
	languageStore,
	readHost: () => climateHub.address,
	saveAddress: (address) =>
		saveUnitAddress(address, {
			createDriver,
			persistHost: (host) => unitAddressStore.save(host),
			applyHost: (host) => {
				climateHub.setHost(host);
			},
			onError: (error) =>
				streamDeck.logger.warn('Cannot check the air conditioner', error),
		}),
});

streamDeck.actions.registerAction(
	new ClimateDialAction(
		climateHub,
		inspectorPanel,
		languageStore,
		idleDashboard,
		scheduleTimeout
	)
);
streamDeck.actions.registerAction(
	new InfoDialAction(climateHub, inspectorPanel, languageStore, idleDashboard)
);
streamDeck.actions.registerAction(
	new EnergyDialAction(climateHub, inspectorPanel, languageStore, idleDashboard)
);
streamDeck.actions.registerAction(
	new SpecialModeKeyAction(climateHub, inspectorPanel, languageStore)
);
streamDeck.actions.registerAction(
	new FanDialAction(climateHub, inspectorPanel, languageStore, idleDashboard)
);
streamDeck.actions.registerAction(
	new PowerKeyAction(climateHub, inspectorPanel, languageStore)
);
streamDeck.actions.registerAction(
	new PresetKeyAction(climateHub, inspectorPanel, languageStore)
);
streamDeck.actions.registerAction(
	new FanKeyAction(climateHub, inspectorPanel, languageStore)
);

void streamDeck.connect();
void unitAddressStore
	.load()
	.then((host) => {
		climateHub.setHost(host);
	})
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the unit address', error)
	);
void languageStore
	.load()
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the language', error)
	);
