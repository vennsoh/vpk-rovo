import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DATE_PICKER_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/datetime-picker",
    description:
      "Date selection input with calendar popover. Maps to @atlaskit/datetime-picker.",
    usage: `import { DatePicker } from "@/components/ui/date-picker"

const [date, setDate] = useState<Date>()
<DatePicker value={date} onChange={setDate} />`,
    props: [
      {
        name: "value",
        type: "Date",
        description: "Currently selected date.",
      },
      {
        name: "onChange",
        type: "(value: Date | undefined) => void",
        description: "Callback when date changes.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Select date"',
        description: "Placeholder text when no date selected.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the date picker.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "date-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected with today's date.",
        demoSlug: "date-picker-demo-with-value",
      },
      { title: "Custom placeholder", demoSlug: "date-picker-demo-placeholder" },
      { title: "Disabled", demoSlug: "date-picker-demo-disabled" },
    ],
  };
