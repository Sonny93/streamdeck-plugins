/** Reads a fixed-size, null-terminated UTF-16 field of a Windows structure. */
export function readUtf16Field(
	packet: Buffer,
	offset: number,
	characterCount: number
): string {
	const text = packet.toString('utf16le', offset, offset + characterCount * 2);
	const end = text.indexOf('\0');
	return end === -1 ? text : text.slice(0, end);
}
