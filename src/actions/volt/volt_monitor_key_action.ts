import { action } from '@elgato/streamdeck';

import type { VoltButton } from '../../volt/volt_button';
import { headphonesGlyph } from '../keys/headphones_glyph';
import { VoltButtonKeyAction } from './volt_button_key_action';

/** Key for the MONITOR button of the Volt 1 (direct monitoring of the inputs). */
@action({ UUID: 'com.sonny93.audio.volt-monitor' })
export class VoltMonitorKeyAction extends VoltButtonKeyAction {
	protected override readonly button: VoltButton = 'monitor';
	protected override readonly defaultLabel = 'Monitor';
	protected override readonly glyph = headphonesGlyph;
}
