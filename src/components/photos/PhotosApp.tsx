"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { photoLibrary } from "@/data/photos";
import type { PhotoAsset } from "@/types";

export function PhotosApp() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef(0);

  const activePhoto = activeIndex === null ? null : photoLibrary[activeIndex] ?? null;

  function openPhoto(index: number) {
    savedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    setActiveIndex(index);
  }

  function closeViewer() {
    setActiveIndex(null);

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = savedScrollTopRef.current;
      }
    });
  }

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current > 0 ? current - 1 : current;
    });
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return current < photoLibrary.length - 1 ? current + 1 : current;
    });
  }

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f7f8]">
      <PhotosLibraryGrid
        photoItems={photoLibrary}
        onOpenPhoto={openPhoto}
        scrollContainerRef={scrollContainerRef}
      />
      <AnimatePresence>
        {activePhoto && activeIndex !== null ? (
          <PhotoViewer
            key={activePhoto.id}
            photo={activePhoto}
            hasPrevious={activeIndex > 0}
            hasNext={activeIndex < photoLibrary.length - 1}
            onClose={closeViewer}
            onPrevious={showPrevious}
            onNext={showNext}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PhotosLibraryGrid({
  photoItems,
  onOpenPhoto,
  scrollContainerRef,
}: {
  photoItems: PhotoAsset[];
  onOpenPhoto: (index: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollContainerRef}
      className="photos-scrollbar h-full overflow-y-scroll overscroll-contain bg-[#f7f7f8] px-[2px] pb-3 pt-[2px]"
    >
      <div className="grid grid-cols-3 gap-[1px]">
        {photoItems.map((photo, index) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            index={index}
            onOpen={() => onOpenPhoto(index)}
          />
        ))}
      </div>
    </div>
  );
}

function PhotoThumbnail({
  photo,
  index,
  onOpen,
}: {
  photo: PhotoAsset;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden bg-black/4"
      aria-label={`Open photo ${index + 1}`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 33vw, 120px"
        className="object-cover transition duration-300 group-hover:scale-[1.02]"
        priority={index < 12}
      />
    </button>
  );
}

function PhotoViewer({
  photo,
  hasPrevious,
  hasNext,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: PhotoAsset;
  hasPrevious: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.debug("[PhotosApp] viewer", {
      photoId: photo.id,
      src: photo.src,
      hasPrevious,
      hasNext,
    });
  }, [photo, hasNext, hasPrevious]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    if (startX === null || endX === null) {
      return;
    }

    const deltaX = endX - startX;

    if (deltaX > 44 && hasPrevious) {
      onPrevious();
    }

    if (deltaX < -44 && hasNext) {
      onNext();
    }

    touchStartXRef.current = null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-20 bg-black"
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pb-3 pt-4 text-white">
        <button
          type="button"
          onClick={onClose}
          className="text-[1rem] font-medium text-[#0a84ff]"
        >
          Done
        </button>
        <div className="w-12" />
      </div>

      <div
        className="relative h-full w-full overflow-hidden pb-9 pt-14"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          key={photo.id}
          initial={{ opacity: 0.82, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.82, scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full w-full items-center justify-center overflow-hidden bg-black px-[6px]"
        >
          <img
            src={photo.src}
            alt={photo.alt}
            className="max-h-full max-w-full object-contain scale-[1.04]"
            draggable={false}
          />
        </motion.div>

        {hasPrevious ? (
          <button
            type="button"
            onClick={onPrevious}
            className="absolute left-0 top-1/2 flex h-20 w-14 -translate-y-1/2 items-center justify-start bg-gradient-to-r from-black/28 to-transparent pl-2 text-3xl text-white/88 transition hover:text-white"
            aria-label="Previous photo"
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}

        {hasNext ? (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-0 top-1/2 flex h-20 w-14 -translate-y-1/2 items-center justify-end bg-gradient-to-l from-black/28 to-transparent pr-2 text-3xl text-white/88 transition hover:text-white"
            aria-label="Next photo"
          >
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
