import { streamDeck } from '@elgato/streamdeck';

import { VoltHub } from './volt/volt_hub';
import { VoltTiming } from './volt/volt_timing';
import { scheduleTimeout } from './shared/schedule_timeout';
import { openVoltConnection } from './volt/open_volt_connection';
import { VoltMonitorKeyAction } from './actions/volt/volt_monitor_key_action';
import { VoltVintageKeyAction } from './actions/volt/volt_vintage_key_action';

const voltHub = new VoltHub({
	openConnection: openVoltConnection,
	schedule: scheduleTimeout,
	reconnectDelayMilliseconds: VoltTiming.reconnectDelayMilliseconds,
	onError: (error) => streamDeck.logger.debug('Volt 1 unavailable', error),
});

streamDeck.actions.registerAction(new VoltMonitorKeyAction(voltHub));
streamDeck.actions.registerAction(new VoltVintageKeyAction(voltHub));

voltHub.start();

void streamDeck.connect();
