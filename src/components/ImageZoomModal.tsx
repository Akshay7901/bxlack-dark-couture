import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export function ImageZoomModal({
  images,
  index,
  alt,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const imgRef = useRef<HTMLImageElement>(null);

  // Lock page scroll and support Escape/arrow keys while the modal is open.
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) {
        setZoomed(false);
        onIndexChange((index + 1) % images.length);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setZoomed(false);
        onIndexChange((index - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, images.length, onClose, onIndexChange]);

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin(`${x}% ${y}%`);
    }
    setZoomed((z) => !z);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Zoomed product image"
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white sm:right-6 sm:top-6"
        >
          <X size={18} />
        </button>

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 sm:left-6 sm:top-6">
          {zoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
          {zoomed ? "Click to zoom out" : "Click to zoom in"}
        </div>

        {images.length > 1 ? (
          <>
            <button
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                onIndexChange((index - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/60 transition-colors hover:text-white sm:left-4"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                onIndexChange((index + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/60 transition-colors hover:text-white sm:right-4"
            >
              <ChevronRight size={26} />
            </button>
          </>
        ) : null}

        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden px-4 py-16 sm:px-16"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={index}
              ref={imgRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={images[index]}
              alt={alt}
              onClick={toggleZoom}
              style={{
                transformOrigin: origin,
                transform: zoomed ? "scale(2.2)" : "scale(1)",
                cursor: zoomed ? "zoom-out" : "zoom-in",
              }}
              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out"
            />
          </AnimatePresence>
        </div>

        {images.length > 1 ? (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
            {index + 1} / {images.length}
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
