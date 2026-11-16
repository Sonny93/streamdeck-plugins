/** Where the plugin stands with the unit: no address yet, nothing read yet, no answer, or a state to show. */
export type ClimateStatus =
	| 'unconfigured'
	| 'loading'
	| 'unreachable'
	| 'ready';
