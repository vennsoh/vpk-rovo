import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TIME_PICKER_DETAIL: ComponentDetail = {
    description:
      "Time selection input using a native select dropdown. Maps to @atlaskit/datetime-picker TimePicker.",
    usage: `import { TimePicker } from "@/components/ui/time-picker"

const [value, setValue] = useState("")
<TimePicker value={value} onChange={setValue} />`,
    props: [
      {
        name: "value",
        type: "string",
        description: "Selected time in HH:mm format.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        description: "Callback when time changes.",
      },
      {
        name: "stepMinutes",
        type: "number",
        default: "30",
        description: "Interval between time options in minutes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the time picker.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "time-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected time.",
        demoSlug: "time-picker-demo-with-value",
      },
      {
        title: "15-minute intervals",
        description: "Time options every 15 minutes.",
        demoSlug: "time-picker-demo-15-min",
      },
      { title: "Disabled", demoSlug: "time-picker-demo-disabled" },
    ],
  };
