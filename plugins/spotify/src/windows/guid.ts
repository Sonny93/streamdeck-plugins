/** The fields of the Win32 `GUID` struct, as koffi encodes them. */
export type Guid = Readonly<{
	Data1: number;
	Data2: number;
	Data3: number;
	Data4: readonly number[];
}>;
