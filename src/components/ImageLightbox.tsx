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

interface Point {
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
    isSwipe?: boolean;
  }>({
    pointerId: null,
    startPointer: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const pinchStateRef = useRef<{
    startDistance: number;
    startZoom: number;
  }>({
    startDistance: 0,
    startZoom: 1,
  });
  const [swipeDelta, setSwipeDelta] = useState(0);
  const swipeThresholdRef = useRef({ horizontal: 50, vertical: 120 });

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

  useEffect(() => {
    // reset swipe delta when image changes
    setSwipeDelta(0);
  }, [currentIndex]);

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

  const updatePointer = (pointerId: number, point: Point) => {
    activePointersRef.current.set(pointerId, point);
  };

  const removePointer = (pointerId: number) => {
    activePointersRef.current.delete(pointerId);
  };

  const getPinchDistance = (first: Point, second: Point) => {
    return Math.hypot(second.x - first.x, second.y - first.y);
  };

  const getPinchCenter = (first: Point, second: Point) => {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePointer(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      pinchStateRef.current = {
        startDistance: getPinchDistance(first, second),
        startZoom: zoom,
      };
      setIsDragging(false);
      dragStateRef.current.isSwipe = false;
      return;
    }

    // If zoom is 1, enable swipe detection instead of pan
    const isSwipe = zoom === 1;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startPosition: position,
      isSwipe,
    };
    setIsDragging(!isSwipe);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    updatePointer(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const currentDistance = getPinchDistance(first, second);
      const distanceRatio = currentDistance / Math.max(pinchStateRef.current.startDistance, 1);
      const nextZoom = Math.min(Math.max(pinchStateRef.current.startZoom * distanceRatio, 1), 5);

      const center = getPinchCenter(first, second);
      const container = containerRef.current;
      const offsetX = container ? center.x - container.getBoundingClientRect().left - container.clientWidth / 2 : 0;
      const offsetY = container ? center.y - container.getBoundingClientRect().top - container.clientHeight / 2 : 0;

      setZoom(nextZoom);
      setPosition(
        clampPosition({
          x: offsetX * (nextZoom - 1) / 2,
          y: offsetY * (nextZoom - 1) / 2,
        })
      );
      return;
    }

    // swipe mode when zoom === 1
    if (dragStateRef.current.isSwipe) {
      // provide visual feedback by tracking horizontal and vertical delta
      const deltaX = e.clientX - dragStateRef.current.startPointer.x;
      // set swipe delta limited to container width
      const container = containerRef.current;
      const max = container ? container.clientWidth : 1000;
      setSwipeDelta(Math.max(-max, Math.min(max, deltaX)));
      return;
    }

    if (!isDragging || dragStateRef.current.pointerId !== e.pointerId) return;

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
    // If this pointer started a swipe, detect horizontal swipe on release
    if (dragStateRef.current.pointerId === e.pointerId) {
      const startX = dragStateRef.current.startPointer.x;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - dragStateRef.current.startPointer.y;

      if (dragStateRef.current.isSwipe) {
        const hThreshold = swipeThresholdRef.current.horizontal;
        const vThreshold = swipeThresholdRef.current.vertical;
        // If vertical swipe is dominant and exceeds threshold, close
        if (Math.abs(deltaY) > vThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
          onClose();
        } else if (Math.abs(deltaX) > hThreshold) {
          if (deltaX > 0) goToPrevious(); else goToNext();
        }
      }

      dragStateRef.current.pointerId = null;
      setIsDragging(false);
      dragStateRef.current.isSwipe = false;
    }

    removePointer(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = {
        startDistance: 0,
        startZoom: zoom,
      };
    }
    // reset swipe delta after finishing
    setSwipeDelta(0);
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
        className="absolute right-3 top-3 md:right-4 md:top-4 z-50 rounded-full bg-sky-400 bg-opacity-80 p-1.5 md:p-2 text-white transition-all hover:bg-opacity-100"
        aria-label="Close"
      >
        <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom controls */}
      <div className="absolute left-3 top-3 md:left-4 md:top-4 z-50 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="pointer-events-auto rounded-full bg-sky-400 bg-opacity-80 p-1.5 md:p-2 text-white transition-all hover:bg-opacity-100"
          aria-label="Zoom in"
          title="Zoom in (+ key or scroll up)"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="pointer-events-auto rounded-full bg-sky-400 bg-opacity-80 p-1.5 md:p-2 text-white transition-all hover:bg-opacity-100"
          aria-label="Zoom out"
          title="Zoom out (- key or scroll down)"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetZoom}
          className="pointer-events-auto rounded-full bg-sky-400 bg-opacity-80 p-1.5 md:p-2 text-white transition-all hover:bg-opacity-100"
          aria-label="Reset zoom"
          title="Reset zoom (0 key)"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Image container */}
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden px-4">
        <img
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain select-none animate-in fade-in duration-150"
          style={{
            transform: `translate3d(${position.x + (zoom === 1 ? swipeDelta : 0)}px, ${position.y}px, 0) scale(${zoom})`,
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
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
          className="absolute left-3 md:left-4 z-50 rounded-full bg-sky-400 bg-opacity-80 p-2 md:p-3 text-white transition-all hover:bg-opacity-100"
          aria-label="Previous image"
        >
          <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={goToNext}
          className="absolute right-3 md:right-4 z-50 rounded-full bg-sky-400 bg-opacity-80 p-2 md:p-3 text-white transition-all hover:bg-opacity-100"
          aria-label="Next image"
        >
          <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Image counter and zoom level */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
        <div className="rounded-full bg-sky-400 bg-opacity-80 px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base text-white">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="rounded-full bg-sky-400 bg-opacity-80 px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base text-white">
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
