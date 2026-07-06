import type { ComponentDetail } from "@/app/data/component-detail-types";

export const COMMIT_DETAIL: ComponentDetail = {
	description:
		"A collapsible commit card displaying git commit details including hash, message, author avatar, relative timestamp, copy-to-clipboard, and an expandable file changes list with color-coded status badges and line change counts.",
	usage: `import {
  Commit,
  CommitHeader,
  CommitAuthor,
  CommitAuthorAvatar,
  CommitInfo,
  CommitMessage,
  CommitMetadata,
  CommitHash,
  CommitSeparator,
  CommitTimestamp,
  CommitActions,
  CommitCopyButton,
  CommitContent,
  CommitFiles,
  CommitFile,
  CommitFileInfo,
  CommitFileStatus,
  CommitFileIcon,
  CommitFilePath,
  CommitFileChanges,
  CommitFileAdditions,
  CommitFileDeletions,
} from "@/components/ui-custom/commit";

<Commit>
  <CommitHeader>
    <CommitAuthor>
      <CommitAuthorAvatar initials="ES" className="mr-3" />
      <CommitInfo>
        <CommitMessage>Refactor auth module</CommitMessage>
        <CommitMetadata>
          <CommitHash>a1b2c3d</CommitHash>
          <CommitSeparator />
          <CommitTimestamp date={new Date()} />
        </CommitMetadata>
      </CommitInfo>
    </CommitAuthor>
    <CommitActions>
      <CommitCopyButton hash="a1b2c3d" />
    </CommitActions>
  </CommitHeader>
  <CommitContent>
    <CommitFiles>
      <CommitFile>
        <CommitFileInfo>
          <CommitFileStatus status="modified" />
          <CommitFileIcon />
          <CommitFilePath>src/auth.ts</CommitFilePath>
        </CommitFileInfo>
        <CommitFileChanges>
          <CommitFileAdditions count={24} />
          <CommitFileDeletions count={8} />
        </CommitFileChanges>
      </CommitFile>
    </CommitFiles>
  </CommitContent>
</Commit>`,
	props: [
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root Collapsible container.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Initial expanded state for the collapsible file list.",
		},
	],
	subComponents: [
		{ name: "CommitHeader", description: "Collapsible trigger row containing author, message, and actions." },
		{ name: "CommitAuthor", description: "Flex container for avatar and commit info." },
		{ name: "CommitAuthorAvatar", description: "Avatar with initials fallback. Requires `initials` prop." },
		{ name: "CommitInfo", description: "Column container for message and metadata." },
		{ name: "CommitMessage", description: "Commit message text." },
		{ name: "CommitMetadata", description: "Row for hash, separator, and timestamp." },
		{ name: "CommitHash", description: "Monospace commit hash with git icon." },
		{ name: "CommitSeparator", description: "Visual separator (defaults to \u2022)." },
		{ name: "CommitTimestamp", description: "Relative time element. Requires `date` prop." },
		{ name: "CommitActions", description: "Action button container (stops event propagation)." },
		{ name: "CommitCopyButton", description: "Copy hash to clipboard. Requires `hash` prop." },
		{ name: "CommitContent", description: "Collapsible content area for file changes." },
		{ name: "CommitFiles", description: "Container for file rows." },
		{ name: "CommitFile", description: "Individual file row with hover highlight." },
		{ name: "CommitFileInfo", description: "File metadata: status badge, icon, and path." },
		{ name: "CommitFileStatus", description: "Color-coded status badge (added/modified/deleted/renamed)." },
		{ name: "CommitFileIcon", description: "File type icon." },
		{ name: "CommitFilePath", description: "Truncated monospace file path." },
		{ name: "CommitFileChanges", description: "Line change statistics container." },
		{ name: "CommitFileAdditions", description: "Green additions count with plus icon." },
		{ name: "CommitFileDeletions", description: "Red deletions count with minus icon." },
	],
	examples: [
		{ title: "Full commit", description: "Complete commit card with author, metadata, copy button, and expandable file changes.", demoSlug: "commit-demo-full" },
		{ title: "Expanded files", description: "Commit with file list expanded by default.", demoSlug: "commit-demo-with-files" },
		{ title: "Minimal", description: "Header-only commit with message, hash, and timestamp.", demoSlug: "commit-demo-minimal" },
		{ title: "Commit list", description: "Multiple commits stacked in a list view.", demoSlug: "commit-demo-multiple" },
	],
};
