import { formatINR, rooms } from "../data/rooms";

export default function Rooms() {
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
            <div className="h-52 w-full bg-slate-100">
              <img
                src={room.image}
                alt={room.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900">{room.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{room.description}</p>
              <p className="mt-4 text-sm font-medium text-brand-700">{formatINR(room.pricePerNight)} / night</p>
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
    </div>
  );
}
