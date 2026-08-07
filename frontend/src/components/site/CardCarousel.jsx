import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

// Wraps a fixed-size set of cards (we only ever pass exactly 3) in a
// touch/drag-friendly carousel. Sized so all 3 are visible side-by-side on
// desktop — matching how these sections looked as a static grid — while
// still being swipeable on smaller screens where they can't all fit.
export function CardCarousel({ items, keyFn, renderItem }) {
  return (
    <Carousel opts={{ align: "start" }} className="mt-12">
      <CarouselContent className="-ml-6">
        {items.map((item) => (
          <CarouselItem key={keyFn(item)} className="basis-full pl-6 sm:basis-1/2 lg:basis-1/3">
            {renderItem(item)}
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-6 flex justify-end gap-2">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
}
