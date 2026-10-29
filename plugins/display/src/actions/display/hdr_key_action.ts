import type { KeyDownEvent } from '@elgato/streamdeck';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { MonitorUnavailableError } from '../../displays/monitor_unavailable_error';
import { hdrGlyph } from '../keys/hdr_glyph';
import type { KeyAppearance } from '../keys/key_appearance';
import type { KeyStateValue } from '../keys/key_state_value';
import { toggleKeyAppearance } from '../keys/toggle_key_appearance';
import type { DisplayActionSettings } from './display_action_settings';
import { DisplayKeyAction } from './display_key_action';
import { resolveHdrKeyState } from './resolve_hdr_key_state';

/** Key that turns the HDR of its monitor on or off, the main one unless another is picked, and lights up while it is on. */
export class HdrKeyAction extends DisplayKeyAction {
	override readonly manifestId = 'com.sonny93.display.hdr';

	protected override readonly offersAll = false;

	override async onKeyDown(
		ev: KeyDownEvent<DisplayActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, async ([monitor]) => {
			if (monitor === undefined || !monitor.hdr.isSupported) {
				throw new MonitorUnavailableError({
					monitorId: monitor?.id ?? '',
					reason: 'The monitor cannot show HDR',
				});
			}
			await this.hub.toggleHdr(monitor.id);
		});
	}

	protected override defaultLabel(): string | undefined {
		return undefined;
	}

	protected override resolveKeyState(
		monitors: readonly MonitorSnapshot[]
	): KeyStateValue {
		return resolveHdrKeyState(monitors[0]);
	}

	protected override appearanceOf(state: KeyStateValue): KeyAppearance {
		return toggleKeyAppearance(hdrGlyph, state);
	}
}
