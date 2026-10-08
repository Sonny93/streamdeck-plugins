/** An action placed on a key (column and row) or on a dial (column is the dial index, row is 0). */
export type ControlPlacement = Readonly<{
	column: number;
	row: number;
	actionUuid: string;
	actionId: string;
}>;
