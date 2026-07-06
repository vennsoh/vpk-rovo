import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ALERT_DETAIL: ComponentDetail = {
    description:
      "Contextual message bar for informational, warning, success, destructive, and announcement states. Maps to @atlaskit/section-message.",
    adsUrl: "https://atlassian.design/components/section-message",
    usage: `import { Alert, AlertAction, AlertTitle, AlertDescription } from "@/components/ui/alert";
import WarningIcon from "@atlaskit/icon/core/status-warning";
import { Icon } from "@/components/ui/icon";

<Alert variant="warning">
  <Icon render={<WarningIcon label="" />} label="Warning" />
  <AlertTitle>Your license is about to expire</AlertTitle>
  <AlertDescription>Renew before March 1 to avoid service interruption.</AlertDescription>
  <AlertAction>
    <a href="#">Renew</a>
  </AlertAction>
</Alert>`,
    props: [
      {
        name: "variant",
        type: '"default" | "info" | "warning" | "success" | "discovery" | "danger" | "error" | "announcement" | "destructive"',
        default: '"default"',
        description:
          "Visual style variant (`default` maps to information, and `destructive` is kept as an alias for backward compatibility).",
      },
    ],
    subComponents: [
      { name: "AlertTitle", description: "Primary heading text." },
      { name: "AlertDescription", description: "Secondary description text." },
      {
        name: "AlertAction",
        description: "Inline action row rendered below alert content.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Information alert style (ADS default appearance).",
        demoSlug: "alert-demo-default",
      },
      { title: "Info", demoSlug: "alert-demo-info" },
      { title: "Warning", demoSlug: "alert-demo-warning" },
      { title: "Success", demoSlug: "alert-demo-success" },
      { title: "Danger", demoSlug: "alert-demo-danger" },
      { title: "Discovery", demoSlug: "alert-demo-discovery" },
      { title: "Error", demoSlug: "alert-demo-error" },
      { title: "Announcement", demoSlug: "alert-demo-announcement" },
      {
        title: "Compound",
        description: "Alert with title, description, and action.",
        demoSlug: "alert-demo-compound",
      },
      {
        title: "All variants",
        description: "All alert variant types side by side.",
        demoSlug: "alert-demo-appearances",
      },
      {
        title: "Destructive alias",
        description: "Backward-compatible alias for destructive state.",
        demoSlug: "alert-demo-destructive",
      },
      {
        title: "With action",
        description: "Alert with action link.",
        demoSlug: "alert-demo-with-action",
      },
      { title: "Basic", demoSlug: "alert-demo-basic" },
      {
        title: "With actions",
        description: "Alert with multiple action links.",
        demoSlug: "alert-demo-with-actions",
      },
      {
        title: "With icons",
        description: "Alerts with status icons.",
        demoSlug: "alert-demo-with-icons",
      },
    ],
  };
