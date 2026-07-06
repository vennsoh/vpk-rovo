import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const CHART_DEMOS: Record<string, ComponentType> = {
	// Area
	"chart-area": dynamic(
		() =>
			import("@/components/charts/area/chart-area").then((mod) => ({
				default: mod.ChartAreaDefault,
			})),
		{ ssr: false },
	),
	"chart-area-interactive": dynamic(
		() =>
			import("@/components/charts/area/chart-area-interactive").then((mod) => ({
				default: mod.ChartAreaInteractive,
			})),
		{ ssr: false },
	),
	"chart-area-axes": dynamic(
		() =>
			import("@/components/charts/area/chart-area-axes").then((mod) => ({
				default: mod.ChartAreaAxes,
			})),
		{ ssr: false },
	),
	"chart-area-gradient": dynamic(
		() =>
			import("@/components/charts/area/chart-area-gradient").then((mod) => ({
				default: mod.ChartAreaGradient,
			})),
		{ ssr: false },
	),
	"chart-area-icons": dynamic(
		() =>
			import("@/components/charts/area/chart-area-icons").then((mod) => ({
				default: mod.ChartAreaIcons,
			})),
		{ ssr: false },
	),
	"chart-area-legend": dynamic(
		() =>
			import("@/components/charts/area/chart-area-legend").then((mod) => ({
				default: mod.ChartAreaLegend,
			})),
		{ ssr: false },
	),
	"chart-area-linear": dynamic(
		() =>
			import("@/components/charts/area/chart-area-linear").then((mod) => ({
				default: mod.ChartAreaLinear,
			})),
		{ ssr: false },
	),
	"chart-area-stacked": dynamic(
		() =>
			import("@/components/charts/area/chart-area-stacked").then((mod) => ({
				default: mod.ChartAreaStacked,
			})),
		{ ssr: false },
	),
	"chart-area-stacked-expanded": dynamic(
		() =>
			import("@/components/charts/area/chart-area-stacked-expanded").then(
				(mod) => ({ default: mod.ChartAreaStackedExpand }),
			),
		{ ssr: false },
	),
	"chart-area-step": dynamic(
		() =>
			import("@/components/charts/area/chart-area-step").then((mod) => ({
				default: mod.ChartAreaStep,
			})),
		{ ssr: false },
	),
	// Bar
	"chart-bar": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar").then((mod) => ({
				default: mod.ChartBarDefault,
			})),
		{ ssr: false },
	),
	"chart-bar-interactive": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-interactive").then((mod) => ({
				default: mod.ChartBarInteractive,
			})),
		{ ssr: false },
	),
	"chart-bar-active": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-active").then((mod) => ({
				default: mod.ChartBarActive,
			})),
		{ ssr: false },
	),
	"chart-bar-chart-stacked-legend": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-chart-stacked-legend").then(
				(mod) => ({ default: mod.ChartBarStacked }),
			),
		{ ssr: false },
	),
	"chart-bar-custom-label": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-custom-label").then((mod) => ({
				default: mod.ChartBarLabelCustom,
			})),
		{ ssr: false },
	),
	"chart-bar-horizontal": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-horizontal").then((mod) => ({
				default: mod.ChartBarHorizontal,
			})),
		{ ssr: false },
	),
	"chart-bar-label": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-label").then((mod) => ({
				default: mod.ChartBarLabel,
			})),
		{ ssr: false },
	),
	"chart-bar-mixed": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-mixed").then((mod) => ({
				default: mod.ChartBarMixed,
			})),
		{ ssr: false },
	),
	"chart-bar-multiple": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-multiple").then((mod) => ({
				default: mod.ChartBarMultiple,
			})),
		{ ssr: false },
	),
	"chart-bar-negative": dynamic(
		() =>
			import("@/components/charts/bar/chart-bar-negative").then((mod) => ({
				default: mod.ChartBarNegative,
			})),
		{ ssr: false },
	),
	// Line
	"chart-line": dynamic(
		() =>
			import("@/components/charts/line/chart-line").then((mod) => ({
				default: mod.ChartLineDefault,
			})),
		{ ssr: false },
	),
	"chart-line-interactive": dynamic(
		() =>
			import("@/components/charts/line/chart-line-interactive").then((mod) => ({
				default: mod.ChartLineInteractive,
			})),
		{ ssr: false },
	),
	"chart-line-custom-dots": dynamic(
		() =>
			import("@/components/charts/line/chart-line-custom-dots").then((mod) => ({
				default: mod.ChartLineDotsCustom,
			})),
		{ ssr: false },
	),
	"chart-line-custom-label": dynamic(
		() =>
			import("@/components/charts/line/chart-line-custom-label").then(
				(mod) => ({ default: mod.ChartLineLabelCustom }),
			),
		{ ssr: false },
	),
	"chart-line-dots": dynamic(
		() =>
			import("@/components/charts/line/chart-line-dots").then((mod) => ({
				default: mod.ChartLineDots,
			})),
		{ ssr: false },
	),
	"chart-line-dots-colors": dynamic(
		() =>
			import("@/components/charts/line/chart-line-dots-colors").then((mod) => ({
				default: mod.ChartLineDotsColors,
			})),
		{ ssr: false },
	),
	"chart-line-label": dynamic(
		() =>
			import("@/components/charts/line/chart-line-label").then((mod) => ({
				default: mod.ChartLineLabel,
			})),
		{ ssr: false },
	),
	"chart-line-linear": dynamic(
		() =>
			import("@/components/charts/line/chart-line.linear").then((mod) => ({
				default: mod.ChartLineLinear,
			})),
		{ ssr: false },
	),
	"chart-line-multiple": dynamic(
		() =>
			import("@/components/charts/line/chart-line-multiple").then((mod) => ({
				default: mod.ChartLineMultiple,
			})),
		{ ssr: false },
	),
	"chart-line-step": dynamic(
		() =>
			import("@/components/charts/line/chart-line-step").then((mod) => ({
				default: mod.ChartLineStep,
			})),
		{ ssr: false },
	),
	// Pie
	"chart-pie": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie").then((mod) => ({
				default: mod.ChartPieSimple,
			})),
		{ ssr: false },
	),
	"chart-pie-custom-label": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-custom-label").then((mod) => ({
				default: mod.ChartPieLabelCustom,
			})),
		{ ssr: false },
	),
	"chart-pie-donut": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-donut").then((mod) => ({
				default: mod.ChartPieDonut,
			})),
		{ ssr: false },
	),
	"chart-pie-donut-active": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-donut-active").then((mod) => ({
				default: mod.ChartPieDonutActive,
			})),
		{ ssr: false },
	),
	"chart-pie-donut-with-text": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-donut-with-text").then(
				(mod) => ({ default: mod.ChartPieDonutText }),
			),
		{ ssr: false },
	),
	"chart-pie-interactive": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-interactive").then((mod) => ({
				default: mod.ChartPieInteractive,
			})),
		{ ssr: false },
	),
	"chart-pie-label": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-label").then((mod) => ({
				default: mod.ChartPieLabel,
			})),
		{ ssr: false },
	),
	"chart-pie-label-list": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-label-list").then((mod) => ({
				default: mod.ChartPieLabelList,
			})),
		{ ssr: false },
	),
	"chart-pie-legend": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-legend").then((mod) => ({
				default: mod.ChartPieLegend,
			})),
		{ ssr: false },
	),
	"chart-pie-separator-none": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-separator-none").then(
				(mod) => ({ default: mod.ChartPieSeparatorNone }),
			),
		{ ssr: false },
	),
	"chart-pie-stacked": dynamic(
		() =>
			import("@/components/charts/pie/chart-pie-stacked").then((mod) => ({
				default: mod.ChartPieStacked,
			})),
		{ ssr: false },
	),
	// Radar
	"chart-radar": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar").then((mod) => ({
				default: mod.ChartRadarDefault,
			})),
		{ ssr: false },
	),
	"chart-radar-custom-label": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-custom-label").then(
				(mod) => ({ default: mod.ChartRadarLabelCustom }),
			),
		{ ssr: false },
	),
	"chart-radar-dots": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-dots").then((mod) => ({
				default: mod.ChartRadarDots,
			})),
		{ ssr: false },
	),
	"chart-radar-grid-circle": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-circle").then(
				(mod) => ({ default: mod.ChartRadarGridCircle }),
			),
		{ ssr: false },
	),
	"chart-radar-grid-circle-filled": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-circle-filled").then(
				(mod) => ({ default: mod.ChartRadarGridCircleFill }),
			),
		{ ssr: false },
	),
	"chart-radar-grid-circle-no-lines": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-circle-no-lines").then(
				(mod) => ({ default: mod.ChartRadarGridCircleNoLines }),
			),
		{ ssr: false },
	),
	"chart-radar-grid-custom": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-custom").then(
				(mod) => ({ default: mod.ChartRadarGridCustom }),
			),
		{ ssr: false },
	),
	"chart-radar-grid-filled": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-filled").then(
				(mod) => ({ default: mod.ChartRadarGridFill }),
			),
		{ ssr: false },
	),
	"chart-radar-grid-none": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-grid-none").then((mod) => ({
				default: mod.ChartRadarGridNone,
			})),
		{ ssr: false },
	),
	"chart-radar-legend": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-legend").then((mod) => ({
				default: mod.ChartRadarLegend,
			})),
		{ ssr: false },
	),
	"chart-radar-lines-only": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-lines-only").then(
				(mod) => ({ default: mod.ChartRadarLinesOnly }),
			),
		{ ssr: false },
	),
	"chart-radar-multiple": dynamic(
		() =>
			import("@/components/charts/radar/chart-radar-multiple").then((mod) => ({
				default: mod.ChartRadarMultiple,
			})),
		{ ssr: false },
	),
	// Radial
	"chart-radial": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial").then((mod) => ({
				default: mod.ChartRadialSimple,
			})),
		{ ssr: false },
	),
	"chart-radial-grid": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial-grid").then((mod) => ({
				default: mod.ChartRadialGrid,
			})),
		{ ssr: false },
	),
	"chart-radial-label": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial-label").then((mod) => ({
				default: mod.ChartRadialLabel,
			})),
		{ ssr: false },
	),
	"chart-radial-shape": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial-shape").then((mod) => ({
				default: mod.ChartRadialShape,
			})),
		{ ssr: false },
	),
	"chart-radial-stacked": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial-stacked").then((mod) => ({
				default: mod.ChartRadialStacked,
			})),
		{ ssr: false },
	),
	"chart-radial-text": dynamic(
		() =>
			import("@/components/charts/radial/chart-radial-text").then((mod) => ({
				default: mod.ChartRadialText,
			})),
		{ ssr: false },
	),
	// Tooltip
	"chart-tooltip": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip").then((mod) => ({
				default: mod.ChartTooltipDefault,
			})),
		{ ssr: false },
	),
	"chart-tooltip-advanced": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-advanced").then(
				(mod) => ({ default: mod.ChartTooltipAdvanced }),
			),
		{ ssr: false },
	),
	"chart-tooltip-custom-label": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-custom-label").then(
				(mod) => ({ default: mod.ChartTooltipLabelCustom }),
			),
		{ ssr: false },
	),
	"chart-tooltip-formatter": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-formatter").then(
				(mod) => ({ default: mod.ChartTooltipFormatter }),
			),
		{ ssr: false },
	),
	"chart-tooltip-icons": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-icons").then((mod) => ({
				default: mod.ChartTooltipIcons,
			})),
		{ ssr: false },
	),
	"chart-tooltip-label-formatter": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-label-formatter").then(
				(mod) => ({ default: mod.ChartTooltipLabelFormatter }),
			),
		{ ssr: false },
	),
	"chart-tooltip-line-indicator": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-line-indicator").then(
				(mod) => ({ default: mod.ChartTooltipIndicatorLine }),
			),
		{ ssr: false },
	),
	"chart-tooltip-no-indicator": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-no-indicator").then(
				(mod) => ({ default: mod.ChartTooltipIndicatorNone }),
			),
		{ ssr: false },
	),
	"chart-tooltip-no-label": dynamic(
		() =>
			import("@/components/charts/tooltip/chart-tooltip-no-label").then(
				(mod) => ({ default: mod.ChartTooltipLabelNone }),
			),
		{ ssr: false },
	),
};

export function getChartDemoComponent(slug: string): ComponentType | null {
	return CHART_DEMOS[slug] ?? null;
}
