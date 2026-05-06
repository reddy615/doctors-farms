import { useState } from "react";
import { formatINR, HERITAGE_COTTAGE_PRICE, rooms } from "../data/rooms";
import ImageLightbox from "../components/ImageLightbox";

export default function Rooms() {
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openGallery = (images: string[], startIndex = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
  };

  const closeLightbox = () => {
    setLightboxImages(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">Rooms & stays</h1>
        <p className="mt-4 text-lg text-slate-600">
          Pick a room that matches your pace—cozy cottages, spacious villas, and comfortable suites with
          farm-inspired details.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div
              className="relative h-52 w-full bg-slate-100 cursor-pointer group"
              onClick={() => room.gallery && openGallery(room.gallery, 0)}
            >
              <img
                src={room.image}
                alt={room.name}
                className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                loading="lazy"
              />
              {room.gallery && room.gallery.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-sky-400 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full p-2 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      room.gallery && openGallery(room.gallery, 0);
                    }}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10l-3.5 3.5a1 1 0 01-1.42 0L8 10m0 0l-3 3m3-3l3-3" />
                    </svg>
                  </button>
                  <span className="text-white text-sm font-medium ml-2">View Gallery</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900">{room.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{room.description}</p>
              <p className="mt-4 text-sm font-medium text-brand-700">
                {room.name === "Heritage Cottage" 
                  ? `${formatINR(HERITAGE_COTTAGE_PRICE)} for 24 hours`
                  : `${formatINR(room.pricePerNight)} / night`
                }
              </p>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                {room.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <a
                  href={`/contact?roomType=${encodeURIComponent(room.name)}`}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700"
                >
                  Book this room
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {lightboxImages && (
        <ImageLightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={closeLightbox} />
      )}
    </div>
  );
}
