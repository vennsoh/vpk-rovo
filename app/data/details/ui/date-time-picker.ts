import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DATE_TIME_PICKER_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/datetime-picker",
    description:
      "Combined date and time picker. Maps to @atlaskit/datetime-picker DateTimePicker.",
    usage: `import { DateTimePicker, type DateTimePickerValue } from "@/components/ui/date-time-picker"

const [value, setValue] = useState<DateTimePickerValue>({})
<DateTimePicker value={value} onChange={setValue} />`,
    props: [
      {
        name: "value",
        type: "DateTimePickerValue",
        description: "Object with date and time properties.",
      },
      {
        name: "onChange",
        type: "(value: DateTimePickerValue) => void",
        description: "Callback when value changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables both pickers.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "date-time-picker-demo-default" },
      {
        title: "With value",
        description: "Pre-selected date and time.",
        demoSlug: "date-time-picker-demo-with-value",
      },
      { title: "Disabled", demoSlug: "date-time-picker-demo-disabled" },
    ],
  };
