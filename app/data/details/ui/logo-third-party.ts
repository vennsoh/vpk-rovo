import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LOGO_THIRD_PARTY_DETAIL: ComponentDetail = {
    description:
      "Typed third-party (3P) brand logos rendered from the upstream platform-labs/logo-third-party package, with local public/3p fallbacks only for brands not yet published upstream. LogoThirdParty takes a typed name (e.g. \"slack\"); a few compatibility named exports remain for existing direct imports. The accessible label defaults to the brand's display name.",
    adsUrl: "https://atlaskit.atlassian.com/packages/platform-labs/logo-third-party",
    usage: `import { LogoThirdParty, SlackLogo } from "@/components/ui/logo-third-party";

<LogoThirdParty name="slack" size="small" />
<LogoThirdParty name="figma" size="medium" />
{/* Convenience named export, same props minus name */}
<SlackLogo size="small" />
{/* Optional wordmark for a lockup layout */}
<LogoThirdParty name="github" wordmark="GitHub" size="small" />
{/* Borderless: just the glyph, no white tile + border */}
<LogoThirdParty name="figma" size="small" borderless />`,
    props: [
      {
        name: "name",
        type: '"adobe-sign" | "airtable" | "asana" | "figma" | "github" | "gitlab" | "notion" | "slack" | "zoom" | … (61 brands)',
        description:
          "Third-party brand id from the upstream @atlassian/logo-third-party package. Prefer this typed id over adding a new per-brand wrapper.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"small"',
        description: "Logo size (shared scale with the Logo component).",
      },
      {
        name: "wordmark",
        type: "string",
        description: "Optional text displayed beside the icon for a lockup layout.",
      },
      {
        name: "borderless",
        type: "boolean",
        default: "false",
        description:
          "Render the bare brand glyph without the package's white tile + border. The mark sits transparently on the surrounding surface — for placement on a row, avatar, or container where the tile would double up.",
      },
      {
        name: "label",
        type: "string",
        description:
          "Accessible label. Defaults to the brand's display name (e.g. \"GitHub\").",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes on the wrapper.",
      },
    ],
    examples: [
      {
        title: "Icons",
        description: "All available third-party brand logos.",
        demoSlug: "logo-third-party-demo-icons",
      },
      {
        title: "Sizes",
        description:
          "All six size options, shown for a solid-fill mark (Figma) and a white-tile mark (Slack) in both the default (tile + border) and borderless treatments.",
        demoSlug: "logo-third-party-demo-sizes",
      },
      {
        title: "Borderless",
        description:
          "Pass borderless to strip the package's white tile + border and render just the brand glyph.",
        demoSlug: "logo-third-party-demo-borderless",
      },
      {
        title: "Lockups",
        description: "Icon + wordmark lockup layout.",
        demoSlug: "logo-third-party-demo-lockups",
      },
      {
        title: "In a Tile",
        description:
          "Picker / suggestion-menu rows: all Tile sizes are shown, including the 16×16 xxsmall tile. Most 3P marks render inside the upstream @atlassian/logo-third-party tile (white background + hairline border), scaled to the tile size. Marks with their own solid-filled background (e.g. Adobe Sign) render bare, with no added border.",
        demoSlug: "logo-third-party-demo-in-tile",
      },
      {
        title: "In a Tag",
        description:
          "Inline chips: each brand mark renders as a bare 16px glyph (no tile or border) filling the chip box, so it never doubles up borders with the surrounding Tag. Marks with their own solid-filled background (e.g. Adobe Sign) need no border either — they fill the box as-is.",
        demoSlug: "logo-third-party-demo-in-tag",
      },
      {
        title: "Compatibility Exports",
        description: "The generic typed API plus retained direct wrappers used by existing callsites.",
        demoSlug: "logo-third-party-demo-named-exports",
      },
    ],
  };
