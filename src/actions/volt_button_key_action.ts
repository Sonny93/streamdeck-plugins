import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import type { VoltHub } from '../volt/volt_hub';
import type { VoltStatus } from '../volt/volt_status';
import type { VoltButton } from '../volt/volt_button';
import { setVoltKeyState } from './set_volt_key_state';

/** Key that shows whether a front panel button of the Volt 1 is on, and flips it when pressed. */
export abstract class VoltButtonKeyAction extends SingletonAction {
	protected abstract readonly button: VoltButton;
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly hub: VoltHub) {
		super();
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		this.unsubscribe ??= this.hub.subscribe((status) => {
			void this.refreshVisibleKeys(status);
		});
		await setVoltKeyState(ev.action, this.hub.current, this.button);
	}

	override onWillDisappear(): void {
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		try {
			await this.hub.toggleButton(this.button);
		} catch (error) {
			streamDeck.logger.warn(`Cannot flip ${this.button} on the Volt 1`, error);
			await ev.action.showAlert();
		}
	}

	private async refreshVisibleKeys(status: VoltStatus): Promise<void> {
		try {
			await Promise.all(
				this.actions
					.toArray()
					.map((visibleAction) =>
						setVoltKeyState(visibleAction, status, this.button)
					)
			);
		} catch (error) {
			streamDeck.logger.error(
				`Cannot update the ${this.button} key of the Volt 1`,
				error
			);
		}
	}
}
