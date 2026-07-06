import type { ComponentDetail } from "@/app/data/component-detail-types";

import { createAgentDetail } from "./agent-detail";

export const AGENT_DETAIL: ComponentDetail = createAgentDetail({
	demoSlugPrefix: "agent",
	importPath: "@/components/blocks/agent",
});
