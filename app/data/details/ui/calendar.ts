import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CALENDAR_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/calendar",
    description:
      "A date picker calendar component built on react-day-picker with comprehensive theme support and selection modes.",
    usage: `import { Calendar } from "@/components/ui/calendar";

<Calendar mode="single" selected={date} onSelect={setDate} />`,
    props: [
      {
        name: "mode",
        type: '"single" | "range" | "multiple"',
        description: "Selection mode.",
      },
      {
        name: "selected",
        type: "Date | DateRange | Date[]",
        description: "Selected date(s).",
      },
      {
        name: "onSelect",
        type: "function",
        description: "Selection change callback.",
      },
      {
        name: "numberOfMonths",
        type: "number",
        description: "Number of months to display.",
      },
      {
        name: "buttonVariant",
        type: "string",
        description: "Button variant for navigation controls.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Calendar with selected date.",
        demoSlug: "calendar-demo-default",
      },
      {
        title: "Range",
        description: "Date range selection with two months.",
        demoSlug: "calendar-demo-range",
      },
      {
        title: "Booked dates",
        description: "Calendar with booked/unavailable dates.",
        demoSlug: "calendar-demo-booked-dates",
      },
      {
        title: "Custom days",
        description: "Calendar with custom day rendering.",
        demoSlug: "calendar-demo-custom-days",
      },
      {
        title: "Date picker range",
        description: "Date picker with range selection.",
        demoSlug: "calendar-demo-date-picker-range",
      },
      {
        title: "Date picker simple",
        description: "Simple date picker.",
        demoSlug: "calendar-demo-date-picker-simple",
      },
      {
        title: "Date picker with dropdowns",
        description: "Date picker with month/year dropdowns.",
        demoSlug: "calendar-demo-date-picker-with-dropdowns",
      },
      {
        title: "In card",
        description: "Calendar inside a card.",
        demoSlug: "calendar-demo-in-card",
      },
      {
        title: "In popover",
        description: "Calendar inside a popover.",
        demoSlug: "calendar-demo-in-popover",
      },
      {
        title: "Multiple",
        description: "Calendar with multiple date selection.",
        demoSlug: "calendar-demo-multiple",
      },
      {
        title: "Range multi month",
        description: "Range selection across two months.",
        demoSlug: "calendar-demo-range-multi-month",
      },
      {
        title: "Range multiple months",
        description: "Range selection across multiple months.",
        demoSlug: "calendar-demo-range-multiple-months",
      },
      {
        title: "Single",
        description: "Single date selection mode.",
        demoSlug: "calendar-demo-single",
      },
      {
        title: "Week numbers",
        description: "Calendar with week numbers.",
        demoSlug: "calendar-demo-week-numbers",
      },
      {
        title: "With presets",
        description: "Calendar with preset date options.",
        demoSlug: "calendar-demo-with-presets",
      },
      {
        title: "With time",
        description: "Calendar with time picker.",
        demoSlug: "calendar-demo-with-time",
      },
    ],
  };
