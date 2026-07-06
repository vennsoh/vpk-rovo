import type { AgentTemplatesAgent } from "@/components/blocks/agent-templates";

type StudioTemplatePromptAgent = Pick<AgentTemplatesAgent, "capabilities" | "description" | "name" | "skills" | "sources">;

export function buildFallbackTemplatePrompt(agent: StudioTemplatePromptAgent): string {
	const appList = agent.sources?.map((source) => source.label).join(", ");
	const skillList = agent.skills?.map((skill) => skill.label).join(", ");
	const featureList = agent.capabilities?.map((capability) => capability.label).join("; ");

	return [
		`Use the ${agent.name} template to create a Rovo agent.`,
		agent.description,
		appList ? `Connect it to ${appList}.` : null,
		skillList ? `Include skills for ${skillList}.` : null,
		featureList ? `It should support these features: ${featureList}.` : null,
		"Keep the prompt concise and ready for me to review before sending.",
	].filter(Boolean).join(" ");
}
