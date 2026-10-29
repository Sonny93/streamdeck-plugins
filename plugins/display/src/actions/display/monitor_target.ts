/** Which monitors an action works on: the primary one, all of them, or one picked in its settings. */
export type MonitorTarget =
	| Readonly<{ kind: 'primary' }>
	| Readonly<{ kind: 'all' }>
	| Readonly<{ kind: 'monitor'; monitorId: string }>;
