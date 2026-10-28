import { action } from '@elgato/streamdeck';

import { tubeGlyph } from '../keys/tube_glyph';
import type { VoltButton } from '../../volt/volt_button';
import { VoltButtonKeyAction } from './volt_button_key_action';

/** Key for the VINTAGE button of the Volt 1 (tube preamp emulation). */
@action({ UUID: 'com.sonny93.audio.volt-vintage' })
export class VoltVintageKeyAction extends VoltButtonKeyAction {
	protected override readonly button: VoltButton = 'vintage';
	protected override readonly defaultLabel = 'Vintage';
	protected override readonly glyph = tubeGlyph;
}
