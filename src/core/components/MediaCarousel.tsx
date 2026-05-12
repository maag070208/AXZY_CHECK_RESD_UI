import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCompress,
  FaExpand,
  FaPlay,
  FaTimes,
} from "react-icons/fa";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  title?: string;
}

interface MediaCarouselProps {
  media: (MediaItem | string)[];
  initialIndex?: number;
  title?: string;
  onClose?: () => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  media: rawMedia,
  initialIndex = 0,
  title = "Galería de Medios",
  onClose,
}) => {
  const media = React.useMemo(() => {
    if (!rawMedia) return [];
    return rawMedia.map((item) => {
      if (typeof item === "string") {
        const isVideo = item.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i);
        return { type: isVideo ? "VIDEO" : "IMAGE", url: item } as MediaItem;
      }
      return item;
    });
  }, [rawMedia]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  }, [media.length]);

  const prevSlide = useCallback(() => {
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  }, [media.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, onClose]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!media || media.length === 0) return null;
  const currentItem = media[currentIndex];

  return (
    <div
      ref={containerRef}
      className={`
        flex flex-col w-full mx-auto overflow-hidden bg-slate-950 transition-all duration-500
        ${isFullscreen ? "h-screen fixed inset-0 z-[9999]" : "h-auto max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-white/5"}
      `}
    >
      {/* Header con botón de cerrar */}
      <div
        className="absolute top-0 inset-x-0 z-20 p-8 flex justify-between items-start pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-auto">
          <h4 className="text-white text-lg font-black uppercase tracking-tight drop-shadow-lg">
            {title}
          </h4>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Evidencia {currentIndex + 1} de {media.length}
          </p>
        </div>
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all shadow-xl"
          >
            {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-rose-500 hover:border-rose-400 transition-all shadow-xl"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Click en la imagen/video para cerrar */}
      <div
        className="flex-1 relative flex items-center justify-center p-12 overflow-hidden bg-black/40 cursor-pointer"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {currentItem.type === "VIDEO" ||
          currentItem.url.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i) ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.title || `Media ${currentIndex}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Nav Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-[1.5rem] bg-white/5 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all z-10 group"
            >
              <FaChevronLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-[1.5rem] bg-white/5 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 transition-all z-10 group"
            >
              <FaChevronRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </>
        )}
      </div>

      {/* Thumbs Bar */}
      <div className="h-24 bg-black/60 backdrop-blur-2xl border-t border-white/5 p-4 flex items-center justify-center gap-4 shrink-0 overflow-x-auto no-scrollbar">
        {media.map((item, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`
              relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0
              ${
                currentIndex === idx
                  ? "border-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "border-white/10 opacity-30 hover:opacity-100 hover:scale-105"
              }
            `}
          >
            {item.type === "VIDEO" ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <FaPlay size={10} className="text-white" />
              </div>
            ) : (
              <img
                src={item.url}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </button>
        ))}
      </div>

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
