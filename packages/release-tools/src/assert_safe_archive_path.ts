import { UnsafeArchivePathError } from './unsafe_archive_path_error.ts';

const FORBIDDEN_CHARACTERS: readonly string[] = ['\\', ':'];
const LAST_CONTROL_CODE = 0x1f;
const FORBIDDEN_SEGMENTS: readonly string[] = ['', '.', '..'];

function hasForbiddenCharacter(
	options: Readonly<{ entryName: string }>
): boolean {
	return Array.from(options.entryName).some(
		(character) =>
			FORBIDDEN_CHARACTERS.includes(character) ||
			(character.codePointAt(0) ?? 0) <= LAST_CONTROL_CODE
	);
}

/** Fails unless the entry name is a relative path of plain segments: no absolute path, no `.` or `..` segment, no `:` or backslash. */
export function assertSafeArchivePath(
	options: Readonly<{ entryName: string }>
): void {
	const { entryName } = options;
	const withoutDirectorySuffix = entryName.endsWith('/')
		? entryName.slice(0, -1)
		: entryName;
	const segments = withoutDirectorySuffix.split('/');
	if (
		hasForbiddenCharacter({ entryName }) ||
		segments.some((segment) => FORBIDDEN_SEGMENTS.includes(segment))
	) {
		throw new UnsafeArchivePathError({ entryName });
	}
}
