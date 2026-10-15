import type { InactivityMonitorOptions } from './inactivity_monitor_options';

type InactivityListener = (isInactive: boolean) => void;

/**
 * Tells when the dials of the Stream Deck have not been used for a while (keys do not count).
 * The countdown starts with the monitor and restarts on every recorded interaction;
 * listeners hear each switch between active and inactive, never a repeat of the same state.
 */
export class InactivityMonitor {
	private readonly listeners = new Set<InactivityListener>();
	private inactive = false;
	private cancelCountdown: () => void;

	constructor(private readonly options: InactivityMonitorOptions) {
		this.cancelCountdown = this.startCountdown();
	}

	/** Whether nothing was recorded during the whole delay. */
	get isInactive(): boolean {
		return this.inactive;
	}

	/** Records an interaction and restarts the countdown; returns whether the Stream Deck was inactive until now. */
	recordActivity(): boolean {
		this.cancelCountdown();
		this.cancelCountdown = this.startCountdown();
		const wasInactive = this.inactive;
		if (wasInactive) {
			this.switchTo(false);
		}
		return wasInactive;
	}

	/** Registers a listener for the switches between active and inactive, and returns the function that unsubscribes it. */
	subscribe(listener: InactivityListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private startCountdown(): () => void {
		return this.options.schedule(() => {
			this.switchTo(true);
		}, this.options.delayMilliseconds);
	}

	private switchTo(isInactive: boolean): void {
		this.inactive = isInactive;
		for (const listener of this.listeners) {
			listener(isInactive);
		}
	}
}
