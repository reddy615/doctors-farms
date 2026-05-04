import { useState, useEffect, useRef } from 'react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number | null;
    startPointer: Position;
    startPosition: Position;
  }>({
    pointerId: null,
    startPointer: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });

  const clampPosition = (nextPosition: Position) => {
    const container = containerRef.current;
    if (!container || zoom === 1) {
      return { x: 0, y: 0 };
    }

    const maxX = (container.clientWidth * (zoom - 1)) / 2;
    const maxY = (container.clientHeight * (zoom - 1)) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextPosition.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPosition.y)),
    };
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 5));
  };

  const zoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.2, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
      }
      return newZoom;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (zoom === 1) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startPosition: position,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging || dragStateRef.current.pointerId !== e.pointerId || zoom === 1) return;

    const deltaX = e.clientX - dragStateRef.current.startPointer.x;
    const deltaY = e.clientY - dragStateRef.current.startPointer.y;

    setPosition(
      clampPosition({
        x: dragStateRef.current.startPosition.x + deltaX,
        y: dragStateRef.current.startPosition.y + deltaY,
      })
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (dragStateRef.current.pointerId === e.pointerId) {
      dragStateRef.current.pointerId = null;
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90"
      style={{ cursor: zoom > 1 && isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white bg-opacity-20 p-2 text-white transition-all hover:bg-opacity-40"
        aria-label="Close"
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom controls */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="rounded-full bg-white bg-opacity-20 p-2 text-white transition-all hover:bg-opacity-40"
          aria-label="Zoom in"
          title="Zoom in (+ key or scroll up)"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="rounded-full bg-white bg-opacity-20 p-2 text-white transition-all hover:bg-opacity-40"
          aria-label="Zoom out"
          title="Zoom out (- key or scroll down)"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetZoom}
          className="rounded-full bg-white bg-opacity-20 p-2 text-white transition-all hover:bg-opacity-40"
          aria-label="Reset zoom"
          title="Reset zoom (0 key)"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Image container */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-4">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-300 select-none"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
            userSelect: 'none',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          draggable={false}
        />

        {/* Previous button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 rounded-full bg-white bg-opacity-20 p-3 text-white transition-all hover:bg-opacity-40"
          aria-label="Previous image"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={goToNext}
          className="absolute right-4 rounded-full bg-white bg-opacity-20 p-3 text-white transition-all hover:bg-opacity-40"
          aria-label="Next image"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Image counter and zoom level */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
        <div className="rounded-full bg-white bg-opacity-20 px-4 py-2 text-white">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="rounded-full bg-white bg-opacity-20 px-4 py-2 text-white">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Pan hint */}
      {zoom > 1 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white text-opacity-40 text-sm">
          Drag to pan
        </div>
      )}
    </div>
  );
}
