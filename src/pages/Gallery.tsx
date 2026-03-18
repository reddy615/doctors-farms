const galleryImages = [
  "/gallery-1.jpg",
  "/gallery-2.jpg",
  "/gallery-3.jpg",
  "/gallery-4.jpg",
  "/gallery-5.jpg",
  "/gallery-6.jpg",
  "/pool-photo.jpg",
  "/gallery-photo.jpg",
];

export default function Gallery() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">Gallery</h1>
        <p className="mt-4 text-lg text-slate-600">
          A peek at the calm, green spaces and restful stays you can enjoy at Doctors Farms.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {galleryImages.map((src, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src={src}
              alt={`Gallery image ${index + 1}`}
              className="h-56 w-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
