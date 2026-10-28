import type { VoltState } from './volt_state';

/**
 * What the plugin knows about the Volt 1.
 * The Volt 1 only reports its state when something happens on it, so it can be plugged in with no known state yet.
 */
export type VoltStatus =
	| Readonly<{ kind: 'disconnected' }>
	| Readonly<{ kind: 'waitingForState' }>
	| Readonly<{ kind: 'ready'; state: VoltState }>;
