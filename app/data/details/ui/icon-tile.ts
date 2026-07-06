import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ICON_TILE_DETAIL: ComponentDetail = {
    description:
      "A tile that wraps an icon, used for feature lists, navigation items, or visual indicators. Supports a transparent sizing-only variant, 20 color variants (10 subtle + 10 bold), colored sizes from xsmall to xlarge, and square or circle shapes.",
    adsUrl: "https://atlassian.design/components/icon/icon-tile",
    usage: `import { IconTile } from "@/components/ui/icon-tile";
import { Icon } from "@/components/ui/icon";
import SearchIcon from "@atlaskit/icon/core/search";

<IconTile icon={<Icon aria-hidden render={<SearchIcon label="" />} />} label="Search" variant="blue" />
<IconTile icon={<Icon aria-hidden render={<SearchIcon label="" size="small" />} />} iconSize="small" label="Search" variant="transparent" size="small" />
<IconTile icon={<Icon aria-hidden render={<SearchIcon label="" />} />} label="Search" variant="blueBold" size="large" shape="circle" />`,
    props: [
      {
        name: "icon",
        type: "React.ReactNode",
        required: true,
        description: "The icon element to display inside the tile.",
      },
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label applied as aria-label.",
      },
      {
        name: "variant",
        type: '"transparent" | "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" | "grayBold" | "blueBold" | ... (21 total)',
        default: '"gray"',
        description:
          "Visual variant of the tile. Transparent keeps only the sizing box and is shown at 16, 24, and 32px; subtle variants use light background with colored icon; bold variants use solid background with white icon.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge"',
        default: '"medium"',
        description: "Size of the tile. Colored examples use xsmall through xlarge; transparent uses xxsmall, small, and medium.",
      },
      {
        name: "iconSize",
        type: '"small" | "medium"',
        default: 'transparent: "small" for xxsmall tiles, otherwise "medium"',
        description:
          'Transparent-only icon size override. Use iconSize="small" for a 12px icon and iconSize="medium" for a 16px icon inside 24px or 32px transparent tiles.',
      },
      {
        name: "shape",
        type: '"square" | "circle"',
        default: '"square"',
        description: "Shape of the tile.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "icon-tile-demo-default" },
      {
        title: "Sizes",
        description: "Colored tile sizes from xsmall to xlarge.",
        demoSlug: "icon-tile-demo-sizes",
      },
      {
        title: "Transparent",
        description: "Backgroundless tiles at 16, 24, and 32px with bespoke icon sizing.",
        demoSlug: "icon-tile-demo-transparent",
      },
      {
        title: "Variants",
        description: "All 10 subtle color variants.",
        demoSlug: "icon-tile-demo-appearances",
      },
      {
        title: "Bold variants",
        description: "All 10 bold color variants.",
        demoSlug: "icon-tile-demo-appearances-bold",
      },
      {
        title: "Shapes",
        description: "Square and circle shapes.",
        demoSlug: "icon-tile-demo-shapes",
      },
    ],
  };
