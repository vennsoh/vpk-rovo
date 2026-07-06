import type { RovoAppHermesContext } from "@/lib/rovo-app-types";
import { isHermesEmbedEnabled } from "@/lib/hermes-feature-flags";

export function buildComposerHermesContext(
	selectedSkillIds: ReadonlyArray<string>,
): RovoAppHermesContext | undefined {
	// Hermes embed disabled: never inject Hermes skill context into prompts.
	if (!isHermesEmbedEnabled()) {
		return undefined;
	}

	const normalizedSkillIds = Array.from(
		new Set(
			selectedSkillIds
				.map((skillId) => skillId.trim())
				.filter((skillId) => skillId.length > 0),
		),
	);

	if (normalizedSkillIds.length === 0) {
		return undefined;
	}

	return {
		selectedSkillIds: normalizedSkillIds,
	};
}

export function shouldResetComposerHermesSkillSelection(options: {
	previousThreadId: string | null;
	nextThreadId: string | null;
}): boolean {
	return (
		options.previousThreadId !== null
		&& options.previousThreadId !== options.nextThreadId
	);
}
