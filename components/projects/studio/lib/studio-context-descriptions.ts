export function mergeContextDescriptions(...parts: Array<string | null | undefined>): string | undefined {
	const mergedParts = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));

	return mergedParts.length > 0 ? mergedParts.join("\n\n") : undefined;
}
