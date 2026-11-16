const UNPARSED_LINE = /^Unparsed capabilities string:\s*(\(.*\))\s*$/mu;

/** Takes the raw MCCS capabilities string out of the output of `ddcutil capabilities --verbose`; `undefined` when it has none. */
export function parseDdcutilCapabilities(output: string): string | undefined {
	return UNPARSED_LINE.exec(output)?.[1];
}
