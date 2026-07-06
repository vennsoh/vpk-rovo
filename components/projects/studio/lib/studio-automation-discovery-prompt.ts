const STUDIO_AUTOMATION_DISCOVERY_SOURCE_PATTERN = /\b(?:slack|jira|confluence|loom|figma|github|bitbucket|calendar|atlas|twg|teamwork graph)\b/giu;

export function isStudioAutomationDiscoveryDemoPrompt(prompt: string): boolean {
	const normalized = prompt
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!normalized) {
		return false;
	}

	const sourceMatches = new Set(normalized.match(STUDIO_AUTOMATION_DISCOVERY_SOURCE_PATTERN) ?? []).size;
	const hasRecentWorkSignal =
		/\b(?:last|past|recent)\s+(?:30|thirty)\s+days?\b/u.test(normalized) ||
		/\b(?:last|past|recent)\s+month\b/u.test(normalized) ||
		normalized.includes("work history") ||
		normalized.includes("recent work");
	const hasAutomationSignal =
		normalized.includes("manual workflow") ||
		normalized.includes("manual workflows") ||
		normalized.includes("repeated workflow") ||
		normalized.includes("automation") ||
		normalized.includes("agentic") ||
		/\bcreate\s+(?:an?\s+)?agents?\b/u.test(normalized);

	return hasRecentWorkSignal && hasAutomationSignal && sourceMatches >= 3;
}
