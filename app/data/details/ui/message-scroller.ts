import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MESSAGE_SCROLLER_DETAIL: ComponentDetail = {
    description:
      "A headless @shadcn/react message-scroller wrapper with VPK styling for chat logs, anchored items, and scroll-to-start/end controls.",
    usage: `import { MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem } from "@/components/ui/message-scroller";

<MessageScroller>
  <MessageScrollerViewport>
    <MessageScrollerContent>
      <MessageScrollerItem>Message</MessageScrollerItem>
    </MessageScrollerContent>
  </MessageScrollerViewport>
</MessageScroller>`,
    props: [
      {
        name: "autoScroll",
        type: "boolean",
        description: "Provider option controlling automatic scrolling behavior.",
      },
      {
        name: "scrollAnchor",
        type: "boolean",
        default: "false",
        description: "Marks a MessageScrollerItem as a scroll anchor.",
      },
      {
        name: "direction",
        type: '"start" | "end"',
        default: '"end"',
        description: "MessageScrollerButton scroll target.",
      },
    ],
    subComponents: [
      { name: "MessageScrollerProvider", description: "Optional provider for scroll behavior configuration." },
      { name: "MessageScrollerViewport", description: "Scrollable viewport." },
      { name: "MessageScrollerContent", description: "Message list content area." },
      { name: "MessageScrollerItem", description: "Virtualized-friendly message item." },
      { name: "MessageScrollerButton", description: "Floating scroll button." },
    ],
    examples: [
      { title: "Chat", demoSlug: "message-scroller-demo-chat" },
    ],
    demoLayout: {
      previewContentWidth: "full",
      examplesContentWidth: "full",
    },
  };
