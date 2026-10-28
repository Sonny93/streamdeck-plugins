const XML_ENTITIES: Readonly<Record<string, string>> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;',
};

/** Escapes the characters that are special in XML text and attribute values. */
export function escapeXml(text: string): string {
	return text.replaceAll(
		/[&<>"']/g,
		(character) => XML_ENTITIES[character] ?? character
	);
}
