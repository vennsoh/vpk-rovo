import type { ComponentDetail } from "@/app/data/component-detail-types";

import { createAgentDetail } from "./agent-detail";

export const AGENT_2_DETAIL: ComponentDetail = createAgentDetail({
	demoSlugPrefix: "agent-2",
	importPath: "@/components/blocks/agent-2",
});
