import { streamDeck } from '@elgato/streamdeck';
import { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
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
import { saveUnitAddress } from './unit_address/save_unit_address';
import { UnitAddressPanel } from './unit_address/unit_address_panel';
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

const idleDashboard = createIdleDashboard({
	inactivity: new InactivityMonitor({
		delayMilliseconds: IdleTiming.inactivityDelayMilliseconds,
		schedule: scheduleTimeout,
	}),
	schedule: scheduleTimeout,
	hub: climateHub,
	onError: (error) =>
		streamDeck.logger.warn('Cannot draw the idle dashboard', error),
});

const unitAddressStore = new UnitAddressStore();

const addressPanel = new UnitAddressPanel({
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
		addressPanel,
		idleDashboard,
		scheduleTimeout
	)
);
streamDeck.actions.registerAction(
	new InfoDialAction(climateHub, addressPanel, idleDashboard)
);
streamDeck.actions.registerAction(
	new EnergyDialAction(climateHub, addressPanel, idleDashboard)
);
streamDeck.actions.registerAction(
	new SpecialModeKeyAction(climateHub, addressPanel)
);
streamDeck.actions.registerAction(
	new FanDialAction(climateHub, addressPanel, idleDashboard)
);
streamDeck.actions.registerAction(new PowerKeyAction(climateHub, addressPanel));
streamDeck.actions.registerAction(
	new PresetKeyAction(climateHub, addressPanel)
);
streamDeck.actions.registerAction(new FanKeyAction(climateHub, addressPanel));

void streamDeck.connect();
void unitAddressStore
	.load()
	.then((host) => {
		climateHub.setHost(host);
	})
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the unit address', error)
	);
