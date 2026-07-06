import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MERMAID_DIAGRAM_DETAIL: ComponentDetail = {
		description: "Dedicated Mermaid diagram block rendered through Streamdown’s Mermaid plugin so fenced mermaid content becomes an interactive SVG diagram instead of a plain code block.",
		usage: `import MermaidDiagram from "@/components/blocks/mermaid-diagram/page";

<MermaidDiagram />`,
	};
