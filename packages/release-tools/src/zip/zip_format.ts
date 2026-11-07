const DOS_EPOCH_YEAR = 1980;
const FIXED_YEAR = 2026;
const FIXED_MONTH = 1;
const FIXED_DAY = 1;
const DOS_YEAR_SHIFT = 9;
const DOS_MONTH_SHIFT = 5;

/** Constants of the zip format: field widths, record signatures, flags, and the fixed timestamp that keeps archives reproducible. */
export const ZipFormat = {
	word: 2,
	doubleWord: 4,
	localHeaderSignature: 0x04034b50,
	centralHeaderSignature: 0x02014b50,
	endRecordSignature: 0x06054b50,
	version: 20,
	utf8Flag: 0x0800,
	storeMethod: 0,
	directoryAttribute: 0x10,
	directorySuffix: '/',
	empty: 0,
	time: 0,
	date:
		((FIXED_YEAR - DOS_EPOCH_YEAR) << DOS_YEAR_SHIFT) |
		(FIXED_MONTH << DOS_MONTH_SHIFT) |
		FIXED_DAY,
} as const;
