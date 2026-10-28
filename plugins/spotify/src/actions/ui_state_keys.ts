import { streamDeck } from '@elgato/streamdeck';
import type { WillAppearEvent } from '@elgato/streamdeck';

import type { UiStateHub } from './ui_state_hub';
import type { SpotifyUiState } from '../spotify/spotify_ui_state';

type VisibleAction = WillAppearEvent['action'];

type UiStateKeysOptions = Readonly<{
	hub: Pick<UiStateHub, 'current' | 'subscribe'>;
	listActions: () => readonly VisibleAction[];
	resolveState: (state: SpotifyUiState | undefined) => number;
	label: string;
}>;

/**
 * Keeps the image of the visible keys of one action in step with the Spotify window state.
 * The keys follow the shared window state from the first one that appears to the last one that disappears.
 */
export class UiStateKeys {
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly options: UiStateKeysOptions) {}

	/** Shows the current state on a key that appeared, starting to follow the window state with the first one. */
	async appear(action: VisibleAction): Promise<void> {
		this.unsubscribe ??= this.options.hub.subscribe(() => {
			void this.refreshVisibleKeys();
		});
		await this.apply(action);
	}

	/** Stops following the window state once no key of the action is visible. */
	disappear(hasVisibleKeys: boolean): void {
		if (hasVisibleKeys) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	private async refreshVisibleKeys(): Promise<void> {
		try {
			await Promise.all(
				this.options.listActions().map((action) => this.apply(action))
			);
		} catch (error) {
			streamDeck.logger.error(
				`Cannot update the ${this.options.label} key state`,
				error
			);
		}
	}

	private async apply(action: VisibleAction): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		await action.setState(this.options.resolveState(this.options.hub.current));
	}
}
