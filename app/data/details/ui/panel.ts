import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PANEL_DETAIL: ComponentDetail = {
    description:
      "A dismissible side-panel surface based on @atlassian/panel-system, with fixed header/footer regions and a scrollable content body.",
    usage: `import {
  Panel,
  PanelActionClose,
  PanelActionGroup,
  PanelBody,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelSubheader,
  PanelTitle,
} from "@/components/ui/panel";

<Panel aria-label="Issue details">
  <PanelHeader>
    <PanelTitle>Jira</PanelTitle>
    <PanelActionGroup>
      <PanelActionClose onClick={closePanel} />
    </PanelActionGroup>
  </PanelHeader>
  <PanelContent>
    <PanelSubheader title="ENG-482 Improve import flow" />
    <PanelBody>Panel content</PanelBody>
  </PanelContent>
  <PanelFooter>Footer actions</PanelFooter>
</Panel>`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "Panel system building blocks, usually PanelHeader, PanelContent, and optional PanelFooter.",
      },
      {
        name: "testId",
        type: "string",
        description: "Adds data-testid to the rendered panel-system part.",
      },
      {
        name: "isFocusLockEnabled",
        type: "boolean",
        default: "false",
        description:
          "Marks the panel container as focus-lock enabled for parity with panel-system API.",
      },
      {
        name: "spacing",
        type: '"none" | "default"',
        default: '"default"',
        description: "Controls PanelBody horizontal padding.",
      },
      {
        name: "disclaimer",
        type: "ReactNode",
        description: "Optional PanelFooter disclaimer slot.",
      },
      {
        name: "onBeforeClose",
        type: "() => boolean | Promise<boolean>",
        description:
          "Optional PanelActionClose guard. Returning false prevents onClick from running.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional classes for the rendered panel-system part.",
      },
    ],
    subComponents: [
      {
        name: "Panel",
        description: "Alias for PanelContainer.",
      },
      {
        name: "PanelContainer",
        description: "Panel surface wrapper for side-panel layouts.",
      },
      {
        name: "PanelHeader",
        description: "Fixed top panel header for title and actions.",
      },
      {
        name: "PanelTitle",
        description: "Header title with optional icon.",
      },
      {
        name: "PanelContent",
        description: "Scrollable region between fixed header and footer.",
      },
      {
        name: "PanelSubheader",
        description: "Optional secondary panel heading with cover image and breadcrumbs.",
      },
      {
        name: "PanelBody",
        description: "Main panel content area with standard 24px horizontal padding.",
      },
      {
        name: "PanelFooter",
        description: "Optional sticky footer for actions and disclaimer content.",
      },
      {
        name: "PanelActionGroup",
        description: "Header action cluster.",
      },
      {
        name: "PanelActionBack",
        description: "Back action for nested drill-in navigation.",
      },
      {
        name: "PanelActionExpand",
        description: "Expand action to widen the panel.",
      },
      {
        name: "PanelActionMore",
        description: "Overflow menu trigger for secondary actions.",
      },
      {
        name: "PanelActionNewTab",
        description: "Link action that opens content in a new tab.",
      },
      {
        name: "PanelActionClose",
        description: "Close action with panel-system default label and optional onBeforeClose intercept.",
      },
      {
        name: "PanelDisclaimer",
        description: "Sunken note rendered below footer actions.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Side panel with app header, actions, and contextual issue content.",
        demoSlug: "panel-demo-default",
      },
      {
        title: "Basic",
        description: "Minimal composition: header with actions, body, and footer.",
        demoSlug: "panel-demo-basic",
      },
      {
        title: "Header",
        description: "Header composition variants: title, leading icon, app logo, back, and action groups.",
        demoSlug: "panel-demo-header",
      },
      {
        title: "Subheader",
        description: "Panel with subheader context and a cover image.",
        demoSlug: "panel-demo-with-subheader",
      },
      {
        title: "Inline edit",
        description: "Subheader title edited in place via the inlineEdit slot.",
        demoSlug: "panel-demo-inline-edit",
      },
      {
        title: "Footer",
        description: "Footer action alignment and one- or two-zone disclaimer variants.",
        demoSlug: "panel-demo-with-footer",
      },
      {
        title: "Loading",
        description: "Default skeleton state for header, subheader, and body.",
        demoSlug: "panel-demo-loading",
      },
      {
        title: "Unsaved changes",
        description: "Intercept close with onBeforeClose to confirm before discarding.",
        demoSlug: "panel-demo-unsaved-changes",
      },
    ],
  };
