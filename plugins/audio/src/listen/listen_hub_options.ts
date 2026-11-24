import type { Scheduler } from 'deck-kit/async/scheduler';
import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';

import type { SourceListening } from './source_listening';

export type ListenHubOptions = Readonly<{
	listening: SourceListening;
	settings: GlobalSettingsPort;
	schedule: Scheduler;
	/** Called when listening cannot be read, a level cannot be saved or the watchdog cut a source. */
	onError: (error: unknown) => void;
}>;
