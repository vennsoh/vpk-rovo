import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHART_DETAIL: ComponentDetail = {
    description:
      "A chart container component that wraps recharts with theme-aware colors, tooltip, and legend support.",
    usage: `import { Bar, BarChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  value: { label: "Value", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

<ChartContainer config={config}>
  <BarChart data={data}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="value" fill="var(--color-value)" />
  </BarChart>
</ChartContainer>`,
    props: [
      {
        name: "config",
        type: "ChartConfig",
        required: true,
        description:
          "Chart configuration mapping data keys to labels and colors.",
      },
    ],
    subComponents: [
      { name: "ChartTooltip", description: "Tooltip wrapper for recharts." },
      { name: "ChartTooltipContent", description: "Styled tooltip content." },
      { name: "ChartLegend", description: "Legend wrapper for recharts." },
      { name: "ChartLegendContent", description: "Styled legend content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Bar chart with tooltip.",
        demoSlug: "chart-demo-default",
      },
      {
        title: "With legend",
        description: "Multi-series chart with legend.",
        demoSlug: "chart-demo-with-legend",
      },
      {
        title: "Area chart",
        description: "Area chart with gradient fill.",
        demoSlug: "chart-demo-area-chart",
      },
      {
        title: "Bar chart",
        description: "Grouped bar chart with multiple series.",
        demoSlug: "chart-demo-bar-chart",
      },
      {
        title: "Line chart",
        description: "Multi-line chart.",
        demoSlug: "chart-demo-line-chart",
      },
      {
        title: "Radar chart",
        description: "Radar chart with multiple series.",
        demoSlug: "chart-demo-radar-chart",
      },
      {
        title: "Radial chart",
        description: "Radial bar chart with center label.",
        demoSlug: "chart-demo-radial-chart",
      },
    ],
  };
