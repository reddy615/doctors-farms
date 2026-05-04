import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  useState(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white bg-opacity-20 p-2 text-white transition-all hover:bg-opacity-40"
        aria-label="Close"
      >
        <X size={32} />
      </button>

      {/* Image container */}
      <div className="relative flex h-full w-full items-center justify-center px-4">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />

        {/* Previous button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 rounded-full bg-white bg-opacity-20 p-3 text-white transition-all hover:bg-opacity-40"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>

        {/* Next button */}
        <button
          onClick={goToNext}
          className="absolute right-4 rounded-full bg-white bg-opacity-20 p-3 text-white transition-all hover:bg-opacity-40"
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white bg-opacity-20 px-4 py-2 text-white">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
