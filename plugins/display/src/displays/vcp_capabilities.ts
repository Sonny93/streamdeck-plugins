/** VCP codes a monitor says it supports, each with the values it lists for it (empty when it lists none). */
export type VcpCapabilities = ReadonlyMap<number, readonly number[]>;
