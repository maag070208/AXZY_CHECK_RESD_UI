import React, { useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import { MediaCarousel } from "./MediaCarousel";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  title?: string;
}

interface ITMediaGridProps {
  media: (MediaItem | string)[];
  title?: string;
  gridSize?: number; // Default 250
}

export const ITMediaGrid: React.FC<ITMediaGridProps> = ({
  media: rawMedia,
  title = "Galería",
  gridSize = 280,
}) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const media = React.useMemo(() => {
    if (!rawMedia) return [];
    return rawMedia.map((item) => {
      if (typeof item === "string") {
        const isVideo = item.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i);
        return { type: isVideo ? "VIDEO" : "IMAGE", url: item } as MediaItem;
      }
      return {
        ...item,
        type: item.type?.toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE",
      } as MediaItem;
    });
  }, [rawMedia]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { current } = scrollRef;
    const scrollAmount = gridSize + 16; // size + gap
    current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (media.length === 0) return null;

  return (
    <div className="w-full relative group/carousel">
      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-slate-100 text-slate-400 hover:text-emerald-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <FaChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white shadow-xl border border-slate-100 text-slate-400 hover:text-emerald-500 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <FaChevronRight size={14} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
      >
        {media.map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedMediaIndex(index)}
            className="relative group overflow-hidden rounded-[2rem] shadow-sm border border-slate-100 bg-white hover:shadow-xl transition-all duration-500 snap-start shrink-0 cursor-pointer"
            style={{ width: gridSize, height: gridSize }}
          >
            {item.type === "VIDEO" ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                <video
                  src={`${item.url}#t=0.5`}
                  className="w-full h-full object-cover opacity-80"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform duration-500">
                    <FaPlay size={18} />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.title || `Media ${index}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/280x280?text=Error";
                }}
              />
            )}

            {/* Badge Type */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10 pointer-events-none">
              {item.type}
            </div>

            {/* Overlay Hint */}
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Fullscreen Carousel Overlay - Custom Premium Experience */}
      {selectedMediaIndex !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 pt-24">
          <div className="relative w-full max-w-[95vw] lg:max-w-6xl animate-in zoom-in-95 duration-300">
            <MediaCarousel
              media={media}
              initialIndex={selectedMediaIndex}
              title={title}
              onClose={() => setSelectedMediaIndex(null)}
            />
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `,
        }}
      />
    </div>
  );
};
