import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MESSAGE_DETAIL: ComponentDetail = {
    description:
      "A composable message row primitive for chat layouts, with avatar, header, content, footer, grouping, and start/end alignment.",
    usage: `import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";

<Message align="end">
  <MessageContent>
    <Bubble align="end">
      <BubbleContent>Ship it.</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>`,
    props: [
      {
        name: "align",
        type: '"start" | "end"',
        default: '"start"',
        description: "Message row alignment.",
      },
    ],
    subComponents: [
      { name: "MessageGroup", description: "Stack of message rows." },
      { name: "MessageAvatar", description: "Avatar slot aligned with the message." },
      { name: "MessageContent", description: "Container for header, bubbles, and footer." },
      { name: "MessageHeader", description: "Metadata above message content." },
      { name: "MessageFooter", description: "Metadata below message content." },
    ],
    examples: [
      { title: "Message", demoSlug: "message-demo-message" },
      { title: "Avatar", demoSlug: "message-demo-avatar" },
      { title: "Group", demoSlug: "message-demo-group" },
      { title: "Group Chat", demoSlug: "message-demo-group-chat" },
      { title: "Header and Footer", demoSlug: "message-demo-header-and-footer" },
      { title: "Actions", demoSlug: "message-demo-actions" },
      { title: "Attachment", demoSlug: "message-demo-attachment" },
      { title: "Attachment Group", demoSlug: "message-demo-attachment-group" },
    ],
  };
