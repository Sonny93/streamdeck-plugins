/** A file or directory of a zip archive. A name ending with a slash is a directory, and its data is empty. */
export type ZipEntry = Readonly<{
	name: string;
	data: Uint8Array;
}>;
