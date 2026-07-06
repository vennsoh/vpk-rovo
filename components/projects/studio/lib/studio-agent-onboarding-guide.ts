import type { ChatPanelLocalConversation } from "@/components/projects/sidebar-chat/page";
import { AGENT_ONBOARDING_TOUR_STEPS, type AgentOnboardingTourStep } from "@/components/projects/studio/data/agent-onboarding-tour";
import { createId } from "@/lib/utils";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export const STUDIO_AGENT_ONBOARDING_GUIDE_SUPPORTED_COMMANDS = "\"next\", \"go back\", or \"done\"";

export type StudioAgentOnboardingGuideCommand = "next" | "back" | "done" | "unknown";
type StudioAgentOnboardingGuideRole = Extract<RovoUIMessage["role"], "assistant" | "user">;

function normalizeStudioAgentOnboardingGuideCommand(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/gu, " ")
		.replace(/\s+/gu, " ")
		.trim();
}

export function resolveStudioAgentOnboardingGuideCommand(text: string): StudioAgentOnboardingGuideCommand {
	const command = normalizeStudioAgentOnboardingGuideCommand(text);
	if (["next", "continue", "forward", "go next", "move on", "show next"].includes(command)) {
		return "next";
	}
	if (["back", "go back", "previous", "prev", "go previous", "last step"].includes(command)) {
		return "back";
	}
	if (["done", "finish", "finished", "end", "skip", "close", "dismiss"].includes(command)) {
		return "done";
	}

	return "unknown";
}

export function createStudioAgentOnboardingGuideMessage({
	createdAt = new Date().toISOString(),
	role,
	text,
}: {
	createdAt?: string;
	role: StudioAgentOnboardingGuideRole;
	text: string;
}): RovoUIMessage {
	return {
		id: createId(`studio-agent-onboarding-guide-${role}`),
		role,
		metadata: {
			origin: "rovo",
			createdAt,
			updatedAt: createdAt,
		},
		parts: [
			{
				type: "text",
				text,
				state: "done",
			},
		],
	};
}

export function getStudioAgentOnboardingGuideGreeting(agentName: string | null): string {
	const subject = agentName ? `${agentName} is ready` : "Your agent is ready";
	return `Congrats - ${subject}. This is step 1 of 4: the agent card is your home base, with the name, summary, and entry point teammates will recognize. Say ${STUDIO_AGENT_ONBOARDING_GUIDE_SUPPORTED_COMMANDS} when you want to steer the tour.`;
}

export function getStudioAgentOnboardingGuideStepNarration(step: AgentOnboardingTourStep | null): string {
	switch (step?.key) {
		case "agent-result-card":
			return "The agent card is the launchpad: it shows what you built, what it is for, and where people can open it later.";
		case "ask-rovo-composer":
			return "This side chat is for fast refinements. Ask for changes to instructions, tools, triggers, or tone, and the draft can keep evolving.";
		case "chat-starters":
			return "These starter prompts are quick test cases. Use them to see whether the agent answers the first teammate requests clearly.";
		case "activate-button":
			return "This is the activation checkpoint. Once the test behavior feels right, activate the agent so it can show up where work happens.";
		default:
			return "This step highlights the next part of the testing flow.";
	}
}

export function getStudioAgentOnboardingGuideStepByIndex(stepIndex: number): AgentOnboardingTourStep | null {
	return AGENT_ONBOARDING_TOUR_STEPS[stepIndex] ?? null;
}

export function buildStudioAgentOnboardingVoiceInput(voiceText: string): string {
	return `Speak much quicker than normal, with tight upbeat pacing. Read only this onboarding narration, without adding extra words:\n${voiceText}`;
}

export function createStudioAgentOnboardingLocalConversation({
	initialAgentName,
	initialVoiceKey,
	isActive,
	messages,
	onSubmit,
	resolveInitialVoiceText,
}: {
	initialAgentName: string | null;
	initialVoiceKey: string | null;
	isActive: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	onSubmit: ChatPanelLocalConversation["onSubmit"];
	resolveInitialVoiceText: (agentName: string | null) => string;
}): ChatPanelLocalConversation | null {
	if (!isActive || messages.length === 0) {
		return null;
	}

	return {
		buildVoiceInput: buildStudioAgentOnboardingVoiceInput,
		initialVoiceKey: initialVoiceKey ?? "generated-agent",
		initialVoiceText: resolveInitialVoiceText(initialAgentName),
		messages,
		onSubmit,
	};
}
