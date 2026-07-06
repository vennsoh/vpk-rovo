import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CAROUSEL_DETAIL: ComponentDetail = {
    description:
      "A carousel component built on embla-carousel-react with horizontal/vertical orientations and navigation controls.",
    usage: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Carousel scroll direction.",
      },
      { name: "opts", type: "object", description: "Embla carousel options." },
      {
        name: "plugins",
        type: "array",
        description: "Embla carousel plugins.",
      },
    ],
    subComponents: [
      {
        name: "CarouselContent",
        description: "Scrollable container for slides.",
      },
      { name: "CarouselItem", description: "Individual slide." },
      { name: "CarouselPrevious", description: "Previous slide button." },
      { name: "CarouselNext", description: "Next slide button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic horizontal carousel.",
        demoSlug: "carousel-demo-default",
      },
      {
        title: "Sizes",
        description: "Multiple visible slides.",
        demoSlug: "carousel-demo-sizes",
      },
      {
        title: "Vertical",
        description: "Vertical carousel.",
        demoSlug: "carousel-demo-vertical",
      },
      { title: "Basic", demoSlug: "carousel-demo-basic" },
      {
        title: "Multiple",
        description: "Carousel with multiple visible slides.",
        demoSlug: "carousel-demo-multiple",
      },
      {
        title: "With gap",
        description: "Carousel with spacing between slides.",
        demoSlug: "carousel-demo-with-gap",
      },
    ],
  };
