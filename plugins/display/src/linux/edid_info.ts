/** What the plugin reads from the EDID a monitor reports. */
export type EdidInfo = Readonly<{
	/** Three-letter PnP manufacturer id, such as `SAM`. */
	manufacturerId: string;
	/** Product code as four hex digits, such as `E05C`. */
	productCode: string;
	/** Serial number, from its descriptor when it has one, else the number of the base block; `undefined` when it has none. */
	serial: string | undefined;
	/** Model name, `undefined` when the EDID gives none. */
	model: string | undefined;
}>;
