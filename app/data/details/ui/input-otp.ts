import type { ComponentDetail } from "@/app/data/component-detail-types";

export const INPUT_OTP_DETAIL: ComponentDetail = {
    description:
      "A one-time password input component with individual digit slots, separators, and animated caret.",
    usage: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`,
    props: [
      {
        name: "maxLength",
        type: "number",
        required: true,
        description: "Maximum number of characters.",
      },
      {
        name: "pattern",
        type: "string",
        description: "Regex pattern for validation.",
      },
    ],
    subComponents: [
      { name: "InputOTPGroup", description: "Container for a group of slots." },
      { name: "InputOTPSlot", description: "Individual digit input slot." },
      {
        name: "InputOTPSeparator",
        description: "Visual separator between groups.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "6-digit OTP in one group.",
        demoSlug: "input-otp-demo-default",
      },
      {
        title: "With separator",
        description: "Two groups separated by a divider.",
        demoSlug: "input-otp-demo-with-separator",
      },
      {
        title: "Pattern",
        description: "Digits and characters pattern.",
        demoSlug: "input-otp-demo-pattern",
      },
      {
        title: "4 digits",
        description: "4-digit OTP input.",
        demoSlug: "input-otp-demo-4-digits",
      },
      {
        title: "Alphanumeric",
        description: "OTP accepting letters and digits.",
        demoSlug: "input-otp-demo-alphanumeric",
      },
      {
        title: "Digits only",
        description: "OTP restricted to digits.",
        demoSlug: "input-otp-demo-digits-only",
      },
      {
        title: "Disabled",
        description: "Disabled OTP input.",
        demoSlug: "input-otp-demo-disabled",
      },
      {
        title: "Form",
        description: "OTP input inside a form.",
        demoSlug: "input-otp-demo-form",
      },
      {
        title: "Invalid state",
        description: "OTP in invalid/error state.",
        demoSlug: "input-otp-demo-invalid-state",
      },
      {
        title: "Simple",
        description: "Simple OTP input without separator.",
        demoSlug: "input-otp-demo-simple",
      },
    ],
  };
