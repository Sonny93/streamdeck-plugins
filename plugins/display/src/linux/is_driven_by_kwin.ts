import type { KscreenOutput } from './kscreen_output';

/** Whether KWin drives the DDC/CI backlight of an output, so its brightness goes through KWin and not through `ddcutil`. */
export function isDrivenByKwin(output: KscreenOutput | undefined): boolean {
	return (
		output !== undefined &&
		output.isDdcCiAllowed &&
		output.brightnessPercent !== undefined
	);
}
