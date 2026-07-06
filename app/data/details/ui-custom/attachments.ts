import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ATTACHMENTS_DETAIL: ComponentDetail = {
	description:
		"A compound attachment system for displaying file and source-document attachments in grid, inline, or list layouts with hover previews, remove buttons, and media-aware icons.",
	usage: `import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ui-custom/attachments";

<Attachments variant="grid">
  {files.map((file) => (
    <Attachment key={file.id} data={file} onRemove={() => remove(file.id)}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  ))}
</Attachments>`,
	props: [
		{
			name: "variant",
			type: '"grid" | "inline" | "list"',
			default: '"grid"',
			description: "Layout presentation mode: grid thumbnails, inline badges, or list rows.",
		},
		{
			name: "data",
			type: "(FileUIPart & { id: string }) | (SourceDocumentUIPart & { id: string })",
			required: true,
			description: "Attachment data object passed to each Attachment item.",
		},
		{
			name: "onRemove",
			type: "() => void",
			description: "Remove callback. When provided, AttachmentRemove renders a dismiss button.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes.",
		},
	],
	subComponents: [
		{ name: "Attachments", description: "Container establishing layout variant context." },
		{ name: "Attachment", description: "Individual item wrapper with data and remove callback." },
		{ name: "AttachmentPreview", description: "Media preview rendering images, video, or category icons." },
		{ name: "AttachmentInfo", description: "Filename and optional media type display." },
		{ name: "AttachmentRemove", description: "Hover-visible remove button with screen-reader label." },
		{ name: "AttachmentHoverCard", description: "Hover preview wrapper for inline attachments." },
		{ name: "AttachmentHoverCardTrigger", description: "Trigger element for the hover card." },
		{ name: "AttachmentHoverCardContent", description: "Content panel for the hover preview." },
		{ name: "AttachmentEmpty", description: "Empty state placeholder when no attachments exist." },
	],
	examples: [
		{ title: "Grid", description: "Grid thumbnail layout with mixed file types and remove buttons.", demoSlug: "attachments-demo-grid" },
		{ title: "Inline", description: "Compact inline badge layout with filename and remove.", demoSlug: "attachments-demo-inline" },
		{ title: "List", description: "Full-row list layout showing media type metadata.", demoSlug: "attachments-demo-list" },
		{ title: "Hover card", description: "Inline badges with hover preview for image attachments.", demoSlug: "attachments-demo-hover-card" },
		{ title: "Read-only", description: "Grid images without remove buttons.", demoSlug: "attachments-demo-read-only" },
		{ title: "Empty state", description: "Empty state when no attachments are present.", demoSlug: "attachments-demo-empty" },
	],
};
