import type { DisplayTarget } from './display_target';

const HeaderOffsets = {
	type: 0,
	size: 4,
	adapterLow: 8,
	adapterHigh: 12,
	id: 16,
} as const;

/** Builds a `DISPLAYCONFIG_DEVICE_INFO_HEADER` packet for a source or target, its body left to zero. */
export function createDeviceInfoPacket(
	kind: Readonly<{ type: number; size: number }>,
	target: DisplayTarget
): Buffer {
	const packet = Buffer.alloc(kind.size);
	packet.writeUInt32LE(kind.type, HeaderOffsets.type);
	packet.writeUInt32LE(kind.size, HeaderOffsets.size);
	packet.writeUInt32LE(target.adapterLow, HeaderOffsets.adapterLow);
	packet.writeInt32LE(target.adapterHigh, HeaderOffsets.adapterHigh);
	packet.writeUInt32LE(target.id, HeaderOffsets.id);
	return packet;
}
