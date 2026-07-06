import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const BLOCK_DEMOS: Record<string, ComponentType> = {
	agent: dynamic(() => import("../demos/blocks/agent-demo"), { ssr: false }),
	"agent-2": dynamic(() => import("../demos/blocks/agent-2-demo"), { ssr: false }),
	"skill-config": dynamic(() => import("../demos/blocks/skill-config-demo"), {
		ssr: false,
	}),
	"trigger-config": dynamic(() => import("../demos/blocks/trigger-config-demo"), {
		ssr: false,
	}),
	"agent-bento": dynamic(() => import("../demos/blocks/agent-bento-demo"), {
		ssr: false,
	}),
	"agent-card": dynamic(() => import("../demos/blocks/agent-card-demo"), {
		ssr: false,
	}),
	"twg-agent-card": dynamic(() => import("../demos/blocks/twg-agent-card-demo"), {
		ssr: false,
	}),
	"agent-profile-card": dynamic(() => import("../demos/blocks/agent-profile-card-demo"), {
		ssr: false,
	}),
	"agent-directory": dynamic(
		() => import("../demos/blocks/agent-directory-demo"),
		{ ssr: false },
	),
	"agent-templates": dynamic(
		() => import("../demos/blocks/agent-templates-demo"),
		{ ssr: false },
	),
	"apps-directory": dynamic(
		() => import("../demos/blocks/apps-directory-demo"),
		{ ssr: false },
	),
	"apps-directory-demo-standard": dynamic(
		() =>
			import("../demos/blocks/apps-directory-demo").then((mod) => ({
				default: mod.AppsDirectoryDemoStandard,
			})),
		{ ssr: false },
	),
	"apps-directory-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/apps-directory-demo").then((mod) => ({
				default: mod.AppsDirectoryDemoExperimental,
			})),
		{ ssr: false },
	),
	artifact: dynamic(() => import("../demos/blocks/artifact-demo"), {
		ssr: false,
	}),
	"tools-directory": dynamic(
		() => import("../demos/blocks/tools-directory-demo"),
		{ ssr: false },
	),
	"skills-directory": dynamic(
		() => import("../demos/blocks/skills-directory-demo"),
		{ ssr: false },
	),
	"skills-directory-demo-standard": dynamic(
		() =>
			import("../demos/blocks/skills-directory-demo").then((mod) => ({
				default: mod.SkillsDirectoryDemoStandard,
			})),
		{ ssr: false },
	),
	"skills-directory-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/skills-directory-demo").then((mod) => ({
				default: mod.SkillsDirectoryDemoExperimental,
			})),
		{ ssr: false },
	),
	"smart-link": dynamic(() => import("../demos/blocks/smart-link-demo"), {
		ssr: false,
	}),
	"knowledge-directory": dynamic(
		() => import("../demos/blocks/knowledge-directory-demo"),
		{ ssr: false },
	),
	"conversation-starters": dynamic(
		() => import("../demos/blocks/conversation-starters-demo"),
		{ ssr: false },
	),
	"agent-users": dynamic(
		() => import("../demos/blocks/agent-users-demo"),
		{ ssr: false },
	),
	"agent-access": dynamic(() => import("../demos/blocks/agent-access-demo"), {
		ssr: false,
	}),
	"agent-evaluation": dynamic(
		() => import("../demos/blocks/agent-evaluation-demo"),
		{ ssr: false },
	),
	"agent-insights": dynamic(
		() => import("../demos/blocks/agent-insights-demo"),
		{ ssr: false },
	),
	"agent-test": dynamic(() => import("../demos/blocks/agent-test-demo"), {
		ssr: false,
	}),
	"agent-surfaces": dynamic(
		() => import("../demos/blocks/agent-surfaces-demo"),
		{ ssr: false },
	),
	"agent-progress": dynamic(
		() => import("../demos/blocks/agent-progress-demo"),
		{ ssr: false },
	),
	"agent-selector": dynamic(
		() => import("../demos/blocks/agent-selector-demo"),
		{ ssr: false },
	),
	"task-progress": dynamic(
		() => import("../demos/blocks/task-progress-demo"),
		{ ssr: false },
	),
	triggers: dynamic(() => import("../demos/blocks/triggers-demo"), {
		ssr: false,
	}),
	"answer-card": dynamic(() => import("../demos/blocks/answer-card-demo"), {
		ssr: false,
	}),
	spotlight: dynamic(() => import("../demos/blocks/spotlight-demo"), {
		ssr: false,
	}),
	"chat-timeline": dynamic(() => import("../demos/blocks/chat-timeline-demo"), {
		ssr: false,
	}),
	"chat-configuration": dynamic(
		() => import("../demos/blocks/chat-configuration-demo"),
		{ ssr: false },
	),
	subagents: dynamic(() => import("../demos/blocks/subagents-demo"), {
		ssr: false,
	}),
	"app-sidebar": dynamic(() => import("../demos/blocks/app-sidebar-demo"), {
		ssr: false,
	}),
	"mermaid-diagram": dynamic(() => import("../demos/blocks/mermaid-diagram-demo"), {
		ssr: false,
	}),
	dashboard: dynamic(() => import("../demos/blocks/dashboard-demo"), {
		ssr: false,
	}),
	"sidebar-01": dynamic(() => import("../demos/blocks/sidebar-01-demo"), {
		ssr: false,
	}),
	"sidebar-02": dynamic(() => import("../demos/blocks/sidebar-02-demo"), {
		ssr: false,
	}),
	"sidebar-03": dynamic(() => import("../demos/blocks/sidebar-03-demo"), {
		ssr: false,
	}),
	"sidebar-04": dynamic(() => import("../demos/blocks/sidebar-04-demo"), {
		ssr: false,
	}),
	"sidebar-05": dynamic(() => import("../demos/blocks/sidebar-05-demo"), {
		ssr: false,
	}),
	"sidebar-06": dynamic(() => import("../demos/blocks/sidebar-06-demo"), {
		ssr: false,
	}),
	"sidebar-07": dynamic(() => import("../demos/blocks/sidebar-07-demo"), {
		ssr: false,
	}),
	"sidebar-08": dynamic(() => import("../demos/blocks/sidebar-08-demo"), {
		ssr: false,
	}),
	"sidebar-09": dynamic(() => import("../demos/blocks/sidebar-09-demo"), {
		ssr: false,
	}),
	"sidebar-10": dynamic(() => import("../demos/blocks/sidebar-10-demo"), {
		ssr: false,
	}),
	"sidebar-11": dynamic(() => import("../demos/blocks/sidebar-11-demo"), {
		ssr: false,
	}),
	"sidebar-12": dynamic(() => import("../demos/blocks/sidebar-12-demo"), {
		ssr: false,
	}),
	"sidebar-13": dynamic(() => import("../demos/blocks/sidebar-13-demo"), {
		ssr: false,
	}),
	"sidebar-14": dynamic(() => import("../demos/blocks/sidebar-14-demo"), {
		ssr: false,
	}),
	"sidebar-15": dynamic(() => import("../demos/blocks/sidebar-15-demo"), {
		ssr: false,
	}),
	"sidebar-16": dynamic(() => import("../demos/blocks/sidebar-16-demo"), {
		ssr: false,
	}),
	"login-01": dynamic(() => import("../demos/blocks/login-01-demo"), {
		ssr: false,
	}),
	"login-02": dynamic(() => import("../demos/blocks/login-02-demo"), {
		ssr: false,
	}),
	"login-03": dynamic(() => import("../demos/blocks/login-03-demo"), {
		ssr: false,
	}),
	"login-04": dynamic(() => import("../demos/blocks/login-04-demo"), {
		ssr: false,
	}),
	"login-05": dynamic(() => import("../demos/blocks/login-05-demo"), {
		ssr: false,
	}),
	chatgpt: dynamic(() => import("../demos/blocks/chatgpt-demo"), { ssr: false }),
	"chat-gallery": dynamic(
		() => import("../demos/blocks/chat-gallery-demo"),
		{ ssr: false },
	),
	"data-table": dynamic(() => import("../demos/blocks/data-table-demo"), {
		ssr: false,
	}),
	"top-navigation": dynamic(
		() => import("../demos/blocks/top-navigation-demo"),
		{ ssr: false },
	),
	"prompt-gallery": dynamic(
		() => import("../demos/blocks/prompt-gallery-demo"),
		{ ssr: false },
	),
	"rovo-canvas": dynamic(
		() => import("../demos/blocks/rovo-canvas-direct-demo"),
		{ ssr: false },
	),
	memory: dynamic(() => import("../demos/blocks/memory-demo"), { ssr: false }),
	"settings-dialog": dynamic(
		() => import("../demos/blocks/settings-dialog-demo"),
		{ ssr: false },
	),
	"product-sidebar": dynamic(
		() => import("../demos/blocks/product-sidebar-demo"),
		{ ssr: false },
	),
	"sidebar-rail": dynamic(() => import("../demos/blocks/sidebar-rail-demo"), {
		ssr: false,
	}),
	"signup-01": dynamic(() => import("../demos/blocks/signup-01-demo"), {
		ssr: false,
	}),
	"signup-02": dynamic(() => import("../demos/blocks/signup-02-demo"), {
		ssr: false,
	}),
	"signup-03": dynamic(() => import("../demos/blocks/signup-03-demo"), {
		ssr: false,
	}),
	"signup-04": dynamic(() => import("../demos/blocks/signup-04-demo"), {
		ssr: false,
	}),
	"signup-05": dynamic(() => import("../demos/blocks/signup-05-demo"), {
		ssr: false,
	}),
	"work-item-widget": dynamic(
		() => import("../demos/blocks/work-item-widget-demo"),
		{ ssr: false },
	),
	"work-item-detail": dynamic(
		() => import("../demos/blocks/work-item-detail-demo"),
		{ ssr: false },
	),
	"question-card": dynamic(() => import("../demos/blocks/question-card-demo"), {
		ssr: false,
	}),
	"approval-card": dynamic(() => import("../demos/blocks/approval-card-demo"), {
		ssr: false,
	}),
	"tool-approval": dynamic(() => import("../demos/blocks/tool-approval-demo"), {
		ssr: false,
	}),
	"terminal-switch": dynamic(
		() => import("../demos/blocks/terminal-switch-demo"),
		{ ssr: false },
	),
	chatbot: dynamic(() => import("../demos/blocks/chatbot-demo"), { ssr: false }),
	cursor: dynamic(() => import("../demos/blocks/cursor-demo"), { ssr: false }),
	"generative-card": dynamic(
		() => import("../demos/blocks/generative-card-demo"),
		{ ssr: false },
	),
	generative: dynamic(() => import("../demos/blocks/generative-demo"), {
		ssr: false,
	}),
	"kanban-board": dynamic(() => import("../demos/blocks/kanban-board-demo"), {
		ssr: false,
	}),
	"visual-waveform": dynamic(
		() => import("../demos/blocks/visual-waveform-demo"),
		{ ssr: false },
	),
	workflow: dynamic(() => import("../demos/blocks/workflow-demo"), {
		ssr: false,
	}),
	"editor-palette": dynamic(() => import("../demos/blocks/editor-palette-demo"), {
		ssr: false,
	}),
	"editor-toolbar": dynamic(() => import("../demos/blocks/editor-toolbar-demo"), {
		ssr: false,
	}),
};

export const BLOCK_VARIANT_DEMOS: Record<string, ComponentType> = {
	"agent-evaluation-demo-filled": dynamic(
		() =>
			import("../demos/blocks/agent-evaluation-demo").then((mod) => ({
				default: mod.AgentEvaluationDemoFilled,
			})),
		{ ssr: false },
	),
	"agent-test-demo-chat-only": dynamic(
		() =>
			import("../demos/blocks/agent-test-demo").then((mod) => ({
				default: mod.AgentTestDemoChatOnly,
			})),
		{ ssr: false },
	),
	"agent-profile-card-chat": dynamic(
		() =>
			import("../demos/blocks/agent-profile-card-demo").then((mod) => ({
				default: mod.AgentProfileCardChatExample,
			})),
		{ ssr: false },
	),
	"agent-profile-card-preview": dynamic(
		() =>
			import("../demos/blocks/agent-profile-card-demo").then((mod) => ({
				default: mod.AgentProfileCardPreviewExample,
			})),
		{ ssr: false },
	),
	"artifact-demo-code-preview": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoCodePreview,
			})),
		{ ssr: false },
	),
	"artifact-demo-image-preview": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoImagePreview,
			})),
		{ ssr: false },
	),
	"artifact-demo-streaming": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoStreaming,
			})),
		{ ssr: false },
	),
	"artifact-demo-chip": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoChip,
			})),
		{ ssr: false },
	),
	"artifact-demo-compound": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoCompound,
			})),
		{ ssr: false },
	),

	// Spotlight
	"spotlight-basic": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightBasicExample,
			})),
		{ ssr: false },
	),
	"spotlight-media": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightMediaExample,
			})),
		{ ssr: false },
	),
	"spotlight-tour": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightTourExample,
			})),
		{ ssr: false },
	),
	"spotlight-target": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightTargetExample,
			})),
		{ ssr: false },
	),
	"spotlight-placements": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightPlacementsExample,
			})),
		{ ssr: false },
	),

	// Editor palette
	"editor-palette-nested": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteNested,
			})),
		{ ssr: false },
	),
	"editor-palette-flat": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteFlat,
			})),
		{ ssr: false },
	),
	"editor-palette-search": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteSearch,
			})),
		{ ssr: false },
	),

	// Agent
	"agent-demo-full": dynamic(
		() =>
			import("../demos/blocks/agent-demo").then((mod) => ({
				default: mod.AgentDemoFull,
			})),
		{ ssr: false },
	),
	"agent-demo-empty": dynamic(
		() =>
			import("../demos/blocks/agent-demo").then((mod) => ({
				default: mod.AgentDemoEmpty,
			})),
		{ ssr: false },
	),

	// Agent 2
	"agent-2-demo-full": dynamic(
		() =>
			import("../demos/blocks/agent-2-demo").then((mod) => ({
				default: mod.AgentDemo2Full,
			})),
		{ ssr: false },
	),
	"agent-2-demo-empty": dynamic(
		() =>
			import("../demos/blocks/agent-2-demo").then((mod) => ({
				default: mod.AgentDemo2Empty,
			})),
		{ ssr: false },
	),

	// Skill Config
	"skill-config-demo-full": dynamic(
		() =>
			import("../demos/blocks/skill-config-demo").then((mod) => ({
				default: mod.SkillConfigDemoFull,
			})),
		{ ssr: false },
	),
	"skill-config-demo-empty": dynamic(
		() =>
			import("../demos/blocks/skill-config-demo").then((mod) => ({
				default: mod.SkillConfigDemoEmpty,
			})),
		{ ssr: false },
	),

	// Trigger Config
	"trigger-config-demo-full": dynamic(
		() =>
			import("../demos/blocks/trigger-config-demo").then((mod) => ({
				default: mod.TriggerConfigDemoFull,
			})),
		{ ssr: false },
	),
	"trigger-config-demo-empty": dynamic(
		() =>
			import("../demos/blocks/trigger-config-demo").then((mod) => ({
				default: mod.TriggerConfigDemoEmpty,
			})),
		{ ssr: false },
	),

	// Agent Directory
	"agent-directory-demo-standard": dynamic(
		() =>
			import("../demos/blocks/agent-directory-demo").then((mod) => ({
				default: mod.AgentsDirectoryDemoStandard,
			})),
		{ ssr: false },
	),
	"agent-directory-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/agent-directory-demo").then((mod) => ({
				default: mod.AgentsDirectoryDemoExperimental,
			})),
		{ ssr: false },
	),

	// Agent Card
	"agent-card-demo-expanded": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExpanded,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimental,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental-template": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimentalTemplate,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental-profile": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimentalProfile,
			})),
		{ ssr: false },
	),
	"agent-card-demo-simple": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoSimple,
			})),
		{ ssr: false },
	),

	// Subagents
	"subagents-demo-empty": dynamic(
		() =>
			import("../demos/blocks/subagents-demo").then((mod) => ({
				default: mod.SubagentsDemoEmpty,
			})),
		{ ssr: false },
	),

	// Smart Link
	"smart-link-demo-rich": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoRich,
			})),
		{ ssr: false },
	),
	"smart-link-demo-article": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoArticle,
			})),
		{ ssr: false },
	),
	"smart-link-demo-team": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoTeam,
			})),
		{ ssr: false },
	),
	"smart-link-demo-goal": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoGoal,
			})),
		{ ssr: false },
	),
	"smart-link-demo-loom": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoLoom,
			})),
		{ ssr: false },
	),
	"smart-link-demo-generic": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoGeneric,
			})),
		{ ssr: false },
	),

	// Agent Selector
	"agent-selector-demo-selected-agent-actions": dynamic(
		() =>
			import("../demos/blocks/agent-selector-demo").then((mod) => ({
				default: mod.AgentSelectorDemoSelectedAgentActions,
			})),
		{ ssr: false },
	),

	// Agent Progress
	"agent-progress-demo-running": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoRunning,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-completed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCompleted,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-failed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoFailed,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-collapsed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCollapsed,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-collapsed-running": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCollapsedRunning,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-with-agents": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoWithAgents,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-early-progress": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoEarlyProgress,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-multiple-runs": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoMultipleRuns,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-all-states": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoAllStates,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-elapsed-time": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoElapsedTime,
			})),
		{ ssr: false },
	),

	// Task Progress
	"task-progress-demo-running": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoRunning,
			})),
		{ ssr: false },
	),
	"task-progress-demo-completed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCompleted,
			})),
		{ ssr: false },
	),
	"task-progress-demo-failed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoFailed,
			})),
		{ ssr: false },
	),
	"task-progress-demo-collapsed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCollapsed,
			})),
		{ ssr: false },
	),
	"task-progress-demo-collapsed-running": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCollapsedRunning,
			})),
		{ ssr: false },
	),
	"task-progress-demo-with-agents": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoWithAgents,
			})),
		{ ssr: false },
	),
	"task-progress-demo-early-progress": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoEarlyProgress,
			})),
		{ ssr: false },
	),
	"task-progress-demo-multiple-runs": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoMultipleRuns,
			})),
		{ ssr: false },
	),
	"task-progress-demo-all-states": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoAllStates,
			})),
		{ ssr: false },
	),
	"task-progress-demo-elapsed-time": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoElapsedTime,
			})),
		{ ssr: false },
	),

	// Triggers
	"triggers-demo-configured": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoConfigured,
			})),
		{ ssr: false },
	),
	"triggers-demo-empty": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoEmpty,
			})),
		{ ssr: false },
	),
	"triggers-demo-picker": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoPicker,
			})),
		{ ssr: false },
	),
	"triggers-demo-multiple": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoMultiple,
			})),
		{ ssr: false },
	),
	"triggers-demo-needs-connection": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoNeedsConnection,
			})),
		{ ssr: false },
	),
	"triggers-demo-manage": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoManage,
			})),
		{ ssr: false },
	),

	// Question Card
	"question-card-demo-single-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoSingleSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-multi-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMultiSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-multi-step-multi-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMultiStepMultiSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-text-only": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoTextOnly,
			})),
		{ ssr: false },
	),
	"question-card-demo-mixed": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMixed,
			})),
		{ ssr: false },
	),
	"question-card-demo-no-custom-input": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoNoCustomInput,
			})),
		{ ssr: false },
	),
	"question-card-demo-custom-placeholder": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoCustomPlaceholder,
			})),
		{ ssr: false },
	),
	"question-card-demo-pre-populated": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoPrePopulated,
			})),
		{ ssr: false },
	),
	"tool-approval-demo-batch": dynamic(
		() =>
			import("../demos/blocks/tool-approval-demo").then((mod) => ({
				default: mod.ToolApprovalDemoBatch,
			})),
		{ ssr: false },
	),
	"tool-approval-demo-submitting": dynamic(
		() =>
			import("../demos/blocks/tool-approval-demo").then((mod) => ({
				default: mod.ToolApprovalDemoSubmitting,
			})),
		{ ssr: false },
	),
	"generative-card-demo-3p": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemo3p,
			})),
		{ ssr: false },
	),
	"generative-card-demo-1p": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemo1p,
			})),
		{ ssr: false },
	),
	"generative-card-demo-icon": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoIcon,
			})),
		{ ssr: false },
	),
	"generative-card-demo-artifact": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoArtifact,
			})),
		{ ssr: false },
	),
	"generative-card-demo-artifact-collapsed": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoArtifactCollapsed,
			})),
		{ ssr: false },
	),
	"generative-card-demo-animated": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoAnimatedExample,
			})),
		{ ssr: false },
	),
	"generative-card-demo-action": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoAction,
			})),
		{ ssr: false },
	),
	"generative-card-demo-trace": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoTrace,
			})),
		{ ssr: false },
	),
	"generative-card-demo-inner-glow": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoInnerGlow,
			})),
		{ ssr: false },
	),
};
