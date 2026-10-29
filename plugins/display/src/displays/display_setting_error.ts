/** Raised when Windows refuses to change a setting of a monitor (HDR, SDR content brightness, gamma ramp). */
export class DisplaySettingError extends Error {
	readonly code = 'E_DISPLAY_SETTING';
	override readonly name = 'DisplaySettingError';

	constructor(options: Readonly<{ setting: string; result: unknown }>) {
		super(
			`Windows refused to change ${options.setting} (${String(options.result)}).`
		);
	}
}
