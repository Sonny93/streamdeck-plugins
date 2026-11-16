import { readdir, readFile } from 'node:fs/promises';

import type { HidrawFileSystem } from './hidraw_file_system';

/** The real file system, for the `/sys/class/hidraw` tree. */
export const nodeHidrawFileSystem: HidrawFileSystem = {
	readDirectory: (path) => readdir(path),
	readFile: (path) => readFile(path),
};
