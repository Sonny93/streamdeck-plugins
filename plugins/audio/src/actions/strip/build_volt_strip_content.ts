import type { Language } from 'deck-kit/i18n/language';
import { buildStripText } from 'deck-kit/strip/build_strip_text';
import { fitStripText } from 'deck-kit/strip/fit_strip_text';

import { audioMessages } from '../../i18n/audio_messages';
import type { VoltButton } from '../../volt/volt_button';
import type { VoltState } from '../../volt/volt_state';
import type { VoltStatus } from '../../volt/volt_status';
import { StripPalette } from './strip_palette';

const MARGIN = 12;
const CONTENT_WIDTH = 176;
const TITLE_FONT_SIZE = 14;
const ROW_FONT_SIZE = 15;
const MESSAGE_FONT_SIZE = 15;
const MESSAGE_Y = 60;
const FIRST_ROW_Y = 46;
const ROW_SPACING = 20;

type VoltRow = Readonly<{
	button: VoltButton;
	label: 'voltMonitor' | 'voltVintage' | 'voltPhantomPower';
}>;

/** The 48V row is only read: it shows the state of the button, and nothing in the plugin can change it from here. */
const ROWS: readonly VoltRow[] = [
	{ button: 'monitor', label: 'voltMonitor' },
	{ button: 'vintage', label: 'voltVintage' },
	{ button: 'phantomPower', label: 'voltPhantomPower' },
];

function buildTitle(language: Language): string {
	return buildStripText({
		text: audioMessages.text('voltTitle', language),
		x: MARGIN,
		y: 22,
		fontSize: TITLE_FONT_SIZE,
		color: StripPalette.secondary,
		isBold: true,
	});
}

function buildMessage(
	key: 'voltNotConnected' | 'voltNoReport',
	language: Language
): string {
	return buildStripText({
		text: fitStripText({
			text: audioMessages.text(key, language),
			fontSize: MESSAGE_FONT_SIZE,
			isBold: false,
			maxWidth: CONTENT_WIDTH,
		}),
		x: MARGIN,
		y: MESSAGE_Y,
		fontSize: MESSAGE_FONT_SIZE,
		color: StripPalette.primary,
	});
}

function buildRow(
	row: VoltRow,
	index: number,
	state: VoltState,
	language: Language
): string {
	const y = FIRST_ROW_Y + index * ROW_SPACING;
	const isOn = state[row.button];
	return [
		buildStripText({
			text: audioMessages.text(row.label, language),
			x: MARGIN,
			y,
			fontSize: ROW_FONT_SIZE,
			color: StripPalette.primary,
		}),
		buildStripText({
			text: audioMessages.text(isOn ? 'buttonOn' : 'buttonOff', language),
			x: MARGIN + CONTENT_WIDTH,
			y,
			fontSize: ROW_FONT_SIZE,
			color: isOn ? StripPalette.accent : StripPalette.secondary,
			anchor: 'end',
			isBold: true,
		}),
	].join('');
}

/**
 * The content of the Volt 1 slot: its name, then the Monitor, Vintage and 48V buttons each with the word On or Off,
 * or one message that tells apart "not connected" from "no report yet" (the Volt 1 reports only on activity).
 * It only reads the status; nothing here can switch a button.
 */
export function buildVoltStripContent(
	status: VoltStatus,
	language: Language
): string {
	if (status.kind === 'disconnected') {
		return buildTitle(language) + buildMessage('voltNotConnected', language);
	}
	if (status.kind === 'waitingForState') {
		return buildTitle(language) + buildMessage('voltNoReport', language);
	}
	return (
		buildTitle(language) +
		ROWS.map((row, index) => buildRow(row, index, status.state, language)).join(
			''
		)
	);
}
