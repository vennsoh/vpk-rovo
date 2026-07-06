import type { ComponentDetail } from "@/app/data/component-detail-types";

export const RESIZABLE_DETAIL: ComponentDetail = {
    description:
      "A draggable panel resize system built on react-resizable-panels with configurable orientations and visible handles.",
    usage: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

<ResizablePanelGroup orientation="horizontal">
  <ResizablePanel defaultSize={50}>Left</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>Right</ResizablePanel>
</ResizablePanelGroup>`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Panel layout direction (on ResizablePanelGroup).",
      },
      {
        name: "withHandle",
        type: "boolean",
        description: "Show visible drag handle (on ResizableHandle).",
      },
      {
        name: "defaultSize",
        type: "number",
        description: "Initial size percentage (on ResizablePanel).",
      },
    ],
    subComponents: [
      { name: "ResizablePanel", description: "Individual resizable panel." },
      { name: "ResizableHandle", description: "Drag handle between panels." },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal resizable panels.",
        demoSlug: "resizable-demo-default",
      },
      {
        title: "Vertical",
        description: "Vertical resizable panels with handle.",
        demoSlug: "resizable-demo-vertical",
      },
      {
        title: "With handle",
        description: "Three panels with visible handles.",
        demoSlug: "resizable-demo-with-handle",
      },
      {
        title: "Controlled",
        description: "Resizable panels with controlled sizes.",
        demoSlug: "resizable-demo-controlled",
      },
      {
        title: "Horizontal",
        description: "Horizontal panel layout.",
        demoSlug: "resizable-demo-horizontal",
      },
      {
        title: "Nested",
        description: "Nested resizable panel groups.",
        demoSlug: "resizable-demo-nested",
      },
    ],
  };
