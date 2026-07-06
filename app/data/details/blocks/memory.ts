import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MEMORY_DETAIL: ComponentDetail = {
		description:
			"Rovo memory modal prototype with two tabs: Rovo's observations about you (a static weekly summary), and Information you've shared directly (a searchable list with add and two-step delete over local state). Includes an INTERNAL ONLY discovery lozenge, a success toast on add, and a write empty state.",
		importStatement: `import { Memory } from "@/components/blocks/memory";`,
		usage: `import { Memory } from "@/components/blocks/memory";

<Memory />`,
	};
