import { streamDeck } from '@elgato/streamdeck';
import { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
import { LanguageStore } from 'deck-kit/i18n/language_store';
import { readSystemLocale } from 'deck-kit/i18n/read_system_locale';
import { IdlePanel } from 'deck-kit/strip/idle_panel';
import { IdleTiming } from 'deck-kit/strip/idle_timing';

import { DefaultOutputKeyAction } from './actions/audio/default_output_key_action';
import { MuteKeyAction } from './actions/audio/mute_key_action';
import { VolumeDialAction } from './actions/audio/volume_dial_action';
import { RestartElgatoAudioKeyAction } from './actions/elgato/restart_elgato_audio_key_action';
import { ListenDialAction } from './actions/listen/listen_dial_action';
import { ListenKeyAction } from './actions/listen/listen_key_action';
import { createAudioPanelFeed } from './actions/strip/create_audio_panel_feed';
import { VoltMonitorKeyAction } from './actions/volt/volt_monitor_key_action';
import { VoltVintageKeyAction } from './actions/volt/volt_vintage_key_action';
import { AudioHub } from './audio/audio_hub';
import { AudioTiming } from './audio/audio_timing';
import { ElgatoAudioRestarter } from './elgato/elgato_audio_restarter';
import { ElgatoAudioTiming } from './elgato/elgato_audio_timing';
import { ListenHub } from './listen/listen_hub';
import { loadPlatformAdapters } from './platform/load_platform_adapters';
import { streamDeckGlobalSettings } from './settings/stream_deck_global_settings';
import { unloadLoopbacksOnExit } from './shutdown/unload_loopbacks_on_exit';
import { VoltHub } from './volt/volt_hub';
import { VoltTiming } from './volt/volt_timing';

const platform = await loadPlatformAdapters(process.platform, (name) => {
	streamDeck.logger.warn(
		`The audio plugin does not support "${name}": its keys stay unavailable`
	);
});

const voltHub = new VoltHub({
	openConnection: platform.openVoltConnection,
	schedule: scheduleTimeout,
	reconnectDelayMilliseconds: VoltTiming.reconnectDelayMilliseconds,
	fastReconnectAttempts: VoltTiming.fastReconnectAttempts,
	maximumReconnectDelayMilliseconds:
		VoltTiming.maximumReconnectDelayMilliseconds,
	onError: (error) => streamDeck.logger.debug('Volt 1 unavailable', error),
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

streamDeck.actions.registerAction(
	new VoltMonitorKeyAction(voltHub, languageStore)
);
streamDeck.actions.registerAction(
	new VoltVintageKeyAction(voltHub, languageStore)
);

const audioHub = new AudioHub({
	loadCoreAudio: platform.audio.loadCoreAudio,
	schedule: scheduleTimeout,
	pollIntervalMilliseconds: platform.audio.pollIntervalMilliseconds,
	watchChanges: platform.audio.watchChanges,
	changeDebounceMilliseconds: AudioTiming.changeDebounceMilliseconds,
	volumeStep: AudioTiming.volumeStep,
	onError: (error) =>
		streamDeck.logger.warn('Cannot read the audio devices', error),
});

const listenHub =
	platform.listening === undefined
		? undefined
		: new ListenHub({
				listening: platform.listening,
				settings: streamDeckGlobalSettings,
				schedule: scheduleTimeout,
				onError: (error) =>
					streamDeck.logger.warn('Cannot read the inputs to listen to', error),
			});

unloadLoopbacksOnExit({
	listening: platform.listening,
	readOwnedModuleIndexes: () => listenHub?.ownedModuleIndexes ?? [],
});

const idlePanel = new IdlePanel({
	inactivity: new InactivityMonitor({
		delayMilliseconds: IdleTiming.inactivityDelayMilliseconds,
		schedule: scheduleTimeout,
	}),
	schedule: scheduleTimeout,
	...createAudioPanelFeed({ audioHub, voltHub, languageStore }),
	onError: (error) =>
		streamDeck.logger.warn('Cannot draw the idle panel', error),
});

streamDeck.actions.registerAction(
	new DefaultOutputKeyAction(audioHub, languageStore)
);
streamDeck.actions.registerAction(new MuteKeyAction(audioHub, languageStore));
streamDeck.actions.registerAction(
	new VolumeDialAction(audioHub, languageStore, idlePanel)
);

streamDeck.actions.registerAction(
	new ListenDialAction(listenHub, languageStore, idlePanel)
);
streamDeck.actions.registerAction(
	new ListenKeyAction(listenHub, languageStore)
);

streamDeck.actions.registerAction(
	new RestartElgatoAudioKeyAction(
		new ElgatoAudioRestarter({
			serverProcess: platform.elgatoAudioServerProcess,
			schedule: scheduleTimeout,
			pollIntervalMilliseconds: ElgatoAudioTiming.pollIntervalMilliseconds,
			restartTimeoutMilliseconds: ElgatoAudioTiming.restartTimeoutMilliseconds,
		}),
		languageStore
	)
);

voltHub.start();
void listenHub
	?.start()
	.catch((error: unknown) =>
		streamDeck.logger.warn('Cannot start listening', error)
	);

void streamDeck.connect();
void languageStore
	.load()
	.catch((error: unknown) =>
		streamDeck.logger.error('Cannot load the language', error)
	);
