"use client";

// Agent 2 is the canonical implementation behind the legacy Agent facade, so
// the Agent 2 catalog demo reuses the same demo owner instead of maintaining a
// second copy of the full interactive surface.
export {
	AgentDemoEmpty as AgentDemo2Empty,
	AgentDemoFull as AgentDemo2Full,
	default,
} from "./agent-demo";
