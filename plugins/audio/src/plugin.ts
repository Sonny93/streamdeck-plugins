import { streamDeck } from '@elgato/streamdeck';

import { DefaultOutputKeyAction } from './actions/audio/default_output_key_action';
import { MuteKeyAction } from './actions/audio/mute_key_action';
import { VolumeDialAction } from './actions/audio/volume_dial_action';
import { VoltMonitorKeyAction } from './actions/volt/volt_monitor_key_action';
import { VoltVintageKeyAction } from './actions/volt/volt_vintage_key_action';
import { AudioHub } from './audio/audio_hub';
import { AudioTiming } from './audio/audio_timing';
import { loadCoreAudio } from './audio/load_core_audio';
import { scheduleTimeout } from './shared/schedule_timeout';
import { openVoltConnection } from './volt/open_volt_connection';
import { VoltHub } from './volt/volt_hub';
import { VoltTiming } from './volt/volt_timing';

const voltHub = new VoltHub({
	openConnection: openVoltConnection,
	schedule: scheduleTimeout,
	reconnectDelayMilliseconds: VoltTiming.reconnectDelayMilliseconds,
	onError: (error) => streamDeck.logger.debug('Volt 1 unavailable', error),
});

streamDeck.actions.registerAction(new VoltMonitorKeyAction(voltHub));
streamDeck.actions.registerAction(new VoltVintageKeyAction(voltHub));

const audioHub = new AudioHub({
	loadCoreAudio,
	schedule: scheduleTimeout,
	pollIntervalMilliseconds: AudioTiming.pollIntervalMilliseconds,
	volumeStep: AudioTiming.volumeStep,
	onError: (error) =>
		streamDeck.logger.warn('Cannot read the audio devices', error),
});

streamDeck.actions.registerAction(new DefaultOutputKeyAction(audioHub));
streamDeck.actions.registerAction(new MuteKeyAction(audioHub));
streamDeck.actions.registerAction(new VolumeDialAction(audioHub));

voltHub.start();

void streamDeck.connect();
