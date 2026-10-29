/** Value of a VCP feature of a monitor, read over DDC/CI. */
export type VcpReply = Readonly<{ current: number; maximum: number }>;
