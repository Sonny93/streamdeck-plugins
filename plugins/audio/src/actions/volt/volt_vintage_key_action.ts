import type { Language } from 'deck-kit/i18n/language';

import { audioMessages } from '../../i18n/audio_messages';
import type { VoltButton } from '../../volt/volt_button';
import { tubeGlyph } from '../keys/tube_glyph';
import { VoltButtonKeyAction } from './volt_button_key_action';

/** Key for the VINTAGE button of the Volt 1 (tube preamp emulation). */
export class VoltVintageKeyAction extends VoltButtonKeyAction {
	override readonly manifestId = 'com.sonny93.audio.volt-vintage';

	protected override readonly button: VoltButton = 'vintage';
	protected override readonly glyph = tubeGlyph;

	protected override defaultLabel(language: Language): string {
		return audioMessages.text('voltVintage', language);
	}
}
