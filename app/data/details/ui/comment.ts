import type { ComponentDetail } from "@/app/data/component-detail-types";

export const COMMENT_DETAIL: ComponentDetail = {
    description:
      "Comment or discussion thread UI with avatar, author, timestamp, and actions. Maps to @atlaskit/comment.",
    adsUrl: "https://atlassian.design/components/comment",
    usage: `import { Comment, CommentAction } from "@/components/ui/comment"

<Comment author="Jane" time="2h ago" actions={<><CommentAction>Reply</CommentAction><span aria-hidden>·</span><CommentAction>Like</CommentAction></>}>
  Great work!
</Comment>`,
    props: [
      {
        name: "author",
        type: "string",
        description: "Author name (required).",
      },
      {
        name: "avatarSrc",
        type: "string",
        description: "URL for the author's avatar image.",
      },
      {
        name: "time",
        type: "string",
        description: "Timestamp or relative time string.",
      },
      {
        name: "edited",
        type: "boolean",
        description: "Displays an 'Edited' label in the header.",
      },
      {
        name: "type",
        type: "string",
        description:
          "Label displayed as a lozenge in the header (e.g. 'author').",
      },
      {
        name: "highlighted",
        type: "boolean",
        description: "Highlights the comment with a subtle background.",
      },
      {
        name: "isSaving",
        type: "boolean",
        description:
          "Enables optimistic saving mode which hides actions and shows saving text.",
      },
      {
        name: "savingText",
        type: "string",
        description:
          "Text displayed during saving mode. Defaults to 'Saving...'.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description:
          "Action buttons rendered below the content. Use CommentAction components with dot separators.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "comment-demo-default" },
      { title: "With timestamp", demoSlug: "comment-demo-with-time" },
      { title: "With avatar", demoSlug: "comment-demo-with-avatar" },
      {
        title: "With actions",
        description: "Comment with action buttons and dot separators.",
        demoSlug: "comment-demo-with-actions",
      },
      {
        title: "Full",
        description:
          "Comment with all features: avatar, type lozenge, timestamp, edited, and actions.",
        demoSlug: "comment-demo-full",
      },
      {
        title: "Edited",
        description: "Comment marked as edited.",
        demoSlug: "comment-demo-edited",
      },
      {
        title: "Highlighted",
        description: "Comment with highlighted background.",
        demoSlug: "comment-demo-highlighted",
      },
      {
        title: "Saving",
        description:
          "Optimistic saving mode hides actions and shows saving text.",
        demoSlug: "comment-demo-saving",
      },
      {
        title: "Thread",
        description: "Nested comment thread with indent.",
        demoSlug: "comment-demo-thread",
      },
    ],
  };
