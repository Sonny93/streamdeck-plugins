import type { Scheduler } from 'deck-kit/async/scheduler';

import type { VoltConnection } from './volt_connection';

export type VoltHubOptions = Readonly<{
	openConnection: () => Promise<VoltConnection>;
	schedule: Scheduler;
	reconnectDelayMilliseconds: number;
	/** Called when the Volt 1 cannot be opened or stops answering; the hub tries again on its own. */
	onError: (error: unknown) => void;
}>;
