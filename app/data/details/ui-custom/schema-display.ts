import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCHEMA_DISPLAY_DETAIL: ComponentDetail = {
	description:
		"A compound component for visualizing REST API endpoints with color-coded HTTP method badges, path parameter highlighting, collapsible parameters/request/response sections, and recursive nested property display.",
	usage: `import {
  SchemaDisplay,
  SchemaDisplayHeader,
  SchemaDisplayMethod,
  SchemaDisplayPath,
  SchemaDisplayDescription,
  SchemaDisplayContent,
  SchemaDisplayParameters,
  SchemaDisplayRequest,
  SchemaDisplayResponse,
  SchemaDisplayProperty,
  SchemaDisplayExample,
} from "@/components/ui-custom/schema-display";

<SchemaDisplay
  method="GET"
  path="/api/users/{id}"
  description="Retrieve a user by their unique identifier."
  parameters={[
    { name: "id", type: "string", required: true, location: "path" },
  ]}
  responseBody={[
    { name: "id", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "email", type: "string", required: true },
  ]}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "method",
			type: '"GET" | "POST" | "PUT" | "PATCH" | "DELETE"',
			required: true,
			description: "HTTP method displayed as a color-coded badge.",
		},
		{
			name: "path",
			type: "string",
			required: true,
			description: "API endpoint path. Parameters in {braces} are highlighted.",
		},
		{
			name: "description",
			type: "string",
			description: "Endpoint description shown below the header.",
		},
		{
			name: "parameters",
			type: "SchemaParameter[]",
			description: "URL, query, or header parameters with name, type, required, description, and location.",
		},
		{
			name: "requestBody",
			type: "SchemaProperty[]",
			description: "Request body properties with recursive nesting support.",
		},
		{
			name: "responseBody",
			type: "SchemaProperty[]",
			description: "Response body properties with recursive nesting support.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "SchemaDisplay", description: "Root container with context provider for method, path, parameters, and body schemas." },
		{ name: "SchemaDisplayHeader", description: "Header row for method badge and path." },
		{ name: "SchemaDisplayMethod", description: "Color-coded HTTP method badge (GET=green, POST=blue, PUT=orange, PATCH=yellow, DELETE=red)." },
		{ name: "SchemaDisplayPath", description: "Monospace endpoint path with highlighted {parameters}." },
		{ name: "SchemaDisplayDescription", description: "Endpoint description paragraph below the header." },
		{ name: "SchemaDisplayContent", description: "Content area with divided sections." },
		{ name: "SchemaDisplayParameters", description: "Collapsible parameters section with count badge." },
		{ name: "SchemaDisplayParameter", description: "Individual parameter row with name, type, location, and required badges." },
		{ name: "SchemaDisplayRequest", description: "Collapsible request body section." },
		{ name: "SchemaDisplayResponse", description: "Collapsible response body section." },
		{ name: "SchemaDisplayProperty", description: "Recursive property display with collapsible nested objects and arrays." },
		{ name: "SchemaDisplayBody", description: "Generic body container with dividers." },
		{ name: "SchemaDisplayExample", description: "Preformatted code example block." },
	],
	examples: [
		{ title: "With parameters", description: "GET endpoint with path, query, and header parameters.", demoSlug: "schema-display-demo-with-params" },
		{ title: "Request and response", description: "POST endpoint with request body and response schema.", demoSlug: "schema-display-demo-with-body" },
		{ title: "Nested properties", description: "Complex schema with nested objects and arrays.", demoSlug: "schema-display-demo-nested" },
		{ title: "HTTP methods", description: "All five HTTP method variants with color-coded badges.", demoSlug: "schema-display-demo-methods" },
		{ title: "Custom composition", description: "Selective sub-component rendering with explicit children.", demoSlug: "schema-display-demo-custom-composition" },
	],
};
