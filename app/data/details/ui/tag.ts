import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TAG_DETAIL: ComponentDetail = {
    description:
      "Categorization label with optional remove button and AvatarTag support. Maps to @atlaskit/tag (Tag + AvatarTag examples).",
    adsUrl: "https://atlassian.design/components/tag/tag",
    usage: `import { Tag } from "@/components/ui/tag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Tag color="blue">Label</Tag>
<Tag variant="rounded" onRemove={() => {}}>Removable</Tag>
	<Tag
	  type="user"
	  elemBefore={
	    <Avatar size="xs">
	      <AvatarImage src="/avatar-user/ali/color/asow-teamwork-blue.png" alt="Alex" />
	      <AvatarFallback>AL</AvatarFallback>
	    </Avatar>
	  }
>
  Alex
</Tag>`,
    props: [
      {
        name: "variant",
        type: '"default" | "rounded" | "editor"',
        default: '"default"',
        description:
          "Tag style. 'editor' drops the border stroke and fills with the solid neutral surface (SkillTag-style) while keeping the leading-icon accent color. Legacy variant values are still supported for compatibility.",
      },
      {
        name: "color",
        type: '"standard" | "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "discovery" | "lime" | "magenta" | "orange" | "teal"',
        default: '"standard"',
        description:
          "Accent color for border and leading icon. Use 'discovery' for semantic purple (ADS discovery tokens).",
      },
      {
        name: "type",
        type: '"default" | "user" | "other" | "agent"',
        default: '"default"',
        description: "AvatarTag mode. Use with `elemBefore` avatar content.",
      },
      {
        name: "elemBefore",
        type: "ReactNode",
        description: "Element rendered before tag text, such as an icon, logo, or avatar.",
      },
      {
        name: "elemAfter",
        type: "ReactNode",
        description:
          "Escape-hatch element rendered after tag text. Sits in its own trailing slot before any remove button and stays fully visible while the label truncates.",
      },
      {
        name: "trailingMetric",
        type: "string | number",
        description:
          "Package-compatible compact metric rendered after tag text using the tag color's accent-subtler fill.",
      },
      {
        name: "isVerified",
        type: "boolean",
        default: "false",
        description: "Shows a verified icon for `type='other'` avatar tags.",
      },
      {
        name: "onRemove",
        type: "() => void",
        description:
          "Callback when remove button is clicked. Shows remove button when provided.",
      },
      {
        name: "removeVariant",
        type: '"inline" | "overlay"',
        default: '"inline"',
        description:
          "How the remove control occupies space. 'inline' reserves space after the label; 'overlay' floats the X over the trailing edge on hover/focus behind a gradient that fades into the label, so the label keeps full width.",
      },
      {
        name: "maxWidth",
        type: "string | number",
        description: "Maximum width before truncating tag text.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "tag-demo-default" },
      {
        title: "Removable",
        description: "Tag with remove button.",
        demoSlug: "tag-demo-removable",
      },
      {
        title: "Front slot",
        description: "Leading Atlassian product logo and 2P/3P public-logo examples using `elemBefore`.",
        demoSlug: "tag-demo-front-slot",
      },
      {
        title: "Editor tag",
        description:
          "Same front-slot tags with `variant=\"editor\"`: the colored border stroke is removed and the surface is filled with the solid `bg-bg-neutral` color (matching SkillTag), while the leading-icon accent color is preserved.",
        demoSlug: "tag-demo-editor-tag",
      },
      {
        title: "Trailing metric",
        description:
          "Trailing count via `trailingMetric`. The metric sits in its own slot before any remove button and stays fully visible while the label truncates. Combine with `elemBefore` and `onRemove` as needed.",
        demoSlug: "tag-demo-badge",
      },
      {
        title: "Removable (overlay)",
        description:
          "Hover or focus a tag to reveal the remove button. It floats over the trailing edge behind a gradient instead of reserving space.",
        demoSlug: "tag-demo-removable-overlay",
      },
      {
        title: "Variants",
        description: "Latest ADS Tag color set.",
        demoSlug: "tag-demo-variants",
      },
      {
        title: "Removable variants",
        description: "All variants with remove buttons.",
        demoSlug: "tag-demo-removable-variants",
      },
      {
        title: "Disabled",
        description: "Disabled state.",
        demoSlug: "tag-demo-disabled",
      },
      {
        title: "Colors",
        description: "All supported color tokens.",
        demoSlug: "tag-demo-colors",
      },
      {
        title: "Rounded",
        description: "Rounded tag variant.",
        demoSlug: "tag-demo-rounded",
      },
      {
        title: "Avatar tags",
        description: "User, other, and agent avatar-tag styles.",
        demoSlug: "tag-demo-avatar-tags",
      },
      {
        title: "Tag Group",
        description: "Container for organizing multiple tags.",
        demoSlug: "tag-demo-tag-group",
      },
      {
        title: "Tag Group removable",
        description: "Tag group with removable tags.",
        demoSlug: "tag-demo-tag-group-removable",
      },
      {
        title: "Tag Group variants",
        description: "Tag group with mixed variant styles.",
        demoSlug: "tag-demo-tag-group-variants",
      },
    ],
  };
