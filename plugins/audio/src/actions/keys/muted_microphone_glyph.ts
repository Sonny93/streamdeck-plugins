/** The struck-through microphone of a muted "Mute" key, drawn in a 24×24 box like the images of the manifest. */
export function mutedMicrophoneGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M8.5 21h7"/><path d="M4 4l16 16" stroke-width="2.4"/></g>`;
}
