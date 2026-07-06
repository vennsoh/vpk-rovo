import type { ComponentDetail } from "@/app/data/component-detail-types";

export const IMAGE_DETAIL: ComponentDetail = {
	description:
		"Renders AI-generated images from the AI SDK's Experimental_GeneratedImage type. Converts base64-encoded image data into a responsive img element with data URI source.",
	usage: `import { Image } from "@/components/ui-custom/image";

<Image
  base64={generatedImage.base64}
  uint8Array={generatedImage.uint8Array}
  mediaType={generatedImage.mediaType}
  alt="AI-generated image"
/>`,
	props: [
		{
			name: "base64",
			type: "string",
			required: true,
			description: "Base64-encoded image data from AI SDK's generateImage result.",
		},
		{
			name: "uint8Array",
			type: "Uint8Array",
			description: "Raw image bytes from AI SDK (not used for rendering, available for download/processing).",
		},
		{
			name: "mediaType",
			type: "string",
			required: true,
			description: "MIME type of the image (e.g., 'image/png', 'image/jpeg').",
		},
		{
			name: "alt",
			type: "string",
			description: "Alternative text for the image element.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to the img element.",
		},
	],
	subComponents: [
		{ name: "Image", description: "Responsive img element that constructs a data URI from base64 and mediaType. Defaults to rounded corners and max-width: 100%." },
	],
	examples: [
		{ title: "Custom styling", description: "Image with custom border, shadow, and aspect ratio via className.", demoSlug: "image-demo-custom-styling" },
		{ title: "Gallery", description: "Multiple generated images displayed in a responsive grid.", demoSlug: "image-demo-gallery" },
		{ title: "In message", description: "Image embedded within a Message compound component for chat contexts.", demoSlug: "image-demo-in-message" },
	],
};
