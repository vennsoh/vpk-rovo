import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SONNER_DETAIL: ComponentDetail = {
    description:
      "A headless toast notification component wrapping Sonner with fully custom JSX. Maps to ADS Flag for transient notifications with auto-dismiss, actions, and semantic variants.",
    adsUrl: "https://atlassian.design/components/flag",
    usage: `import { toast } from "sonner";
import { SonnerToast, Toaster } from "@/components/ui/sonner";

// In layout/page:
<Toaster />

// To trigger:
toast.custom((id) => (
  <SonnerToast
    appearance="success"
    title="Saved!"
    dismissible
    onDismiss={() => toast.dismiss(id)}
  />
));

toast.custom((id) => (
  <SonnerToast
    appearance="warning"
    title="This action cannot be undone."
    action={{ label: "Undo", onClick: () => {} }}
    dismissible
    onDismiss={() => toast.dismiss(id)}
  />
), { duration: 10000 });`,
    examples: [
      {
        title: "Default",
        description: "Basic toast notification.",
        demoSlug: "sonner-demo-default",
      },
      {
        title: "Variants",
        description: "Success, error, warning, and info toasts.",
        demoSlug: "sonner-demo-variants",
      },
      {
        title: "With description",
        description: "Toast with description text.",
        demoSlug: "sonner-demo-with-description",
      },
      {
        title: "With action",
        description: "Toast with action button (like ADS Flag actions).",
        demoSlug: "sonner-demo-with-action",
      },
      {
        title: "Auto-dismiss",
        description: "Custom auto-dismiss duration (like ADS AutoDismissFlag).",
        demoSlug: "sonner-demo-auto-dismiss",
      },
      {
        title: "Promise",
        description: "Async toast with loading, success, and error states.",
        demoSlug: "sonner-demo-promise",
      },
      {
        title: "With close button",
        description: "Toast with explicit close button.",
        demoSlug: "sonner-demo-close-button",
      },
      {
        title: "Long title",
        description: "Toast with long title text, close button, and action.",
        demoSlug: "sonner-demo-long-title",
      },
    ],
  };
