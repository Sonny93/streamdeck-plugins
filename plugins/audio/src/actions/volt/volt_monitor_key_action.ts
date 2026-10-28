import type { VoltButton } from '../../volt/volt_button';
import { headphonesGlyph } from '../keys/headphones_glyph';
import { VoltButtonKeyAction } from './volt_button_key_action';

/** Key for the MONITOR button of the Volt 1 (direct monitoring of the inputs). */
export class VoltMonitorKeyAction extends VoltButtonKeyAction {
	override readonly manifestId = 'com.sonny93.audio.volt-monitor';

	protected override readonly button: VoltButton = 'monitor';
	protected override readonly defaultLabel = 'Monitor';
	protected override readonly glyph = headphonesGlyph;
}
