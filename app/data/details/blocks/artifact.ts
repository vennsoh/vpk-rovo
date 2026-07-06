import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ARTIFACT_DETAIL: ComponentDetail = {
		description:
			"A card for displaying AI-generated artifacts like code, documents, images, or sheets. The high-level ArtifactCard component provides kind-based icons, expand/collapse, streaming state, and preview rendering built on GenerativeCard. Low-level compound components (Artifact, ArtifactHeader, etc.) are also available for custom layouts.",
		usage: `import { ArtifactCard } from "@/components/blocks/artifact";

<ArtifactCard
  kind="code"
  title="Algorithm Implementation"
  previewContent={codeString}
  onOpen={() => openArtifact()}
/>

{/* Or use compound components for custom layouts: */}
import {
  Artifact, ArtifactHeader, ArtifactTitle,
  ArtifactActions, ArtifactAction, ArtifactContent,
} from "@/components/blocks/artifact";`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "kind", type: '"text" | "code" | "image" | "sheet" | "react"', description: "The artifact content type. Determines the default icon tile and color." },
			{ name: "visualIdentity", type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }', description: "Optional icon-tile override used instead of the kind-based default." },
			{ name: "title", type: "string", description: "Artifact title text." },
			{ name: "action", type: '"create" | "update" | null', description: "Optional action context for description text." },
			{ name: "isStreaming", type: "boolean", description: "Whether the artifact is currently streaming." },
			{ name: "displayMode", type: '"preview" | "chip"', description: 'Display mode. "preview" shows expanded card, "chip" shows compact inline card. Defaults to "preview".' },
			{ name: "previewContent", type: "string", description: "Content string for the preview (code text, image URL, etc.)." },
			{ name: "onOpen", type: "(element: HTMLDivElement) => void", description: 'Callback when the "Open" button is clicked. Receives the card root element.' },
			{ name: "onRegister", type: "(element: HTMLDivElement) => void", description: "Optional callback fired when a preview-mode card mounts. Receives the card root element." },
			{ name: "children", type: "ReactNode", description: "Optional children rendered inside the card content (overrides previewContent)." },
			{ name: "className", type: "string", description: "Additional classes for the outer wrapper." },
		],
		subComponents: [
			{ name: "ArtifactCard", description: "High-level artifact card built on GenerativeCard with kind-based icons, expand/collapse, and preview rendering." },
			{ name: "ArtifactPanel", description: "Full artifact viewer/editor panel with title, kind badge, edit/preview toggle, copy, and close. Renders code, images, or text." },
			{ name: "Artifact", description: "Low-level root container for custom artifact layouts." },
			{ name: "ArtifactHeader", description: "Header bar with title area and actions. Uses flexbox with justify-between." },
			{ name: "ArtifactTitle", description: "Title text rendered as a paragraph with medium font weight." },
			{ name: "ArtifactDescription", description: "Subtitle/description text in muted foreground color." },
			{ name: "ArtifactActions", description: "Container for grouping action buttons with gap spacing." },
			{ name: "ArtifactAction", description: "Individual icon button with optional tooltip. Accepts icon (LucideIcon), tooltip (string), and label (string) props." },
			{ name: "ArtifactClose", description: "Close button defaulting to an X icon. Renders a ghost Button." },
			{ name: "ArtifactContent", description: "Scrollable content area with padding. Use className='p-0' for edge-to-edge content like CodeBlock." },
		],
		examples: [
			{ title: "Code preview", description: "ArtifactCard displaying a code artifact with preview and expand/collapse.", demoSlug: "artifact-demo-code-preview" },
			{ title: "Image preview", description: "ArtifactCard displaying an image artifact with gradient overlay.", demoSlug: "artifact-demo-image-preview" },
			{ title: "Streaming", description: "ArtifactCard in streaming state showing skeleton loading and spinner.", demoSlug: "artifact-demo-streaming" },
			{ title: "Chip mode", description: "Compact inline artifact card with 'Open' action button.", demoSlug: "artifact-demo-chip" },
			{ title: "Compound (legacy)", description: "Custom layout using low-level compound components.", demoSlug: "artifact-demo-compound" },
		],
	};
