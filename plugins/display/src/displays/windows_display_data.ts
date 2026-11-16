import type { DisplayTarget } from './display_target';
import type { HdrApiVersion } from './hdr_api_version';

/** What only the Windows adapter knows about a monitor. */
export type WindowsDisplayData = Readonly<{
	kind: 'windows';
	/** GDI device name of the desktop source, such as `\\.\DISPLAY1`. */
	gdiName: string;
	target: DisplayTarget;
	hdrApiVersion: HdrApiVersion;
	/** White level of SDR content while HDR is on, in thousandths of 80 nits; `undefined` when Windows does not tell. */
	sdrWhiteLevel: number | undefined;
}>;
