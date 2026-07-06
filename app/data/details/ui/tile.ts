import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TILE_DETAIL: ComponentDetail = {
    description:
      "A base tile component — a rounded square that takes an asset and represents a noun. Supports 28 color variants across semantic, accent subtle, and accent bold categories.",
    adsUrl: "https://atlassian.design/components/tile",
    usage: `import { Tile } from "@/components/ui/tile";
import SearchIcon from "@atlaskit/icon/core/search";

<Tile label="Search" variant="blueSubtle" size="medium">
  <SearchIcon label="" />
</Tile>`,
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label applied as aria-label.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"medium"',
        description: "Size of the tile.",
      },
      {
        name: "variant",
        type: '"neutral" | "brand" | "danger" | "warning" | "success" | "discovery" | "information" | "transparent" | "blueSubtle" | "blueBold" | ... (28 total)',
        default: '"neutral"',
        description: "Color variant of the tile.",
      },
      {
        name: "isInset",
        type: "boolean",
        default: "true",
        description: "Whether the tile has internal padding.",
      },
      {
        name: "isSnug",
        type: "boolean",
        default: "false",
        description:
          "Snug 2px inset: a fixed 2px pad on every side while the content fills the rest of the box (e.g. a 24px small tile yields 20px of content). Takes precedence over isInset. Pair with variant=\"transparent\" for a bare container around logos, avatars, or icons.",
      },
      {
        name: "hasBorder",
        type: "boolean",
        default: "false",
        description: "Whether the tile has a border.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "tile-demo-default" },
      {
        title: "Sizes",
        description: "All six tile sizes.",
        demoSlug: "tile-demo-sizes",
      },
      {
        title: "Transparent",
        description:
          "All six sizes with a transparent backdrop — keeps the sizing box without a background fill.",
        demoSlug: "tile-demo-transparent",
      },
      {
        title: "Variants",
        description: "Semantic, accent subtle, and accent bold variants.",
        demoSlug: "tile-demo-appearances",
      },
      {
        title: "With border",
        description: "Tile with border enabled.",
        demoSlug: "tile-demo-border",
      },
      {
        title: "Custom SVG",
        description:
          "With and without internal padding for edge-to-edge content.",
        demoSlug: "tile-demo-inset",
      },
      {
        title: "Snug inset",
        description:
          "A 2px inset on a transparent box: a 24px tile holds 20px of content. Wraps 1P product logos, agent avatars, and automation/app icons.",
        demoSlug: "tile-demo-snug",
      },
    ],
  };
