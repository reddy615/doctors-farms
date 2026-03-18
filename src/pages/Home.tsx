import { Link } from "react-router-dom";

const features = [
  {
    title: "Eco-friendly retreat",
    description:
      "Enjoy a sustainable stay wrapped in natural materials, solar energy, and locally sourced amenities.",
  },
  {
    title: "Wellness & detox",
    description:
      "Choose from curated wellness packages with yoga, meditation, and nourishing farm-to-table meals.",
  },
  {
    title: "Farm-stay experience",
    description:
      "Participate in seasonal farming activities and learn how organic food is grown.",
  },
];

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="relative min-h-[72vh] px-4 py-28 text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster="/hero.png"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/farms-viedo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Relax. Heal. Reconnect with Nature.
            </h1>
            <p className="mt-6 text-lg text-white/90">
              Doctors Farms Resort is a calm nature escape where wellness meets organic living. Book a stay
              and step into a slower rhythm.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-10 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition hover:bg-slate-100"
              >
                Quick booking
              </Link>
              <Link
                to="/rooms"
                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 px-10 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                Explore rooms
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl bg-brand-50 p-10">
            <h2 className="text-2xl font-semibold text-brand-900">Wellness packages</h2>
            <p className="mt-3 text-slate-700">
              Recharge with a curated wellness stay. Book one of our packages and enjoy a balanced plan of yoga,
              detox-friendly meals, and optional health consultations.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>
                  Detox stay — guided juices, herbal infusions, and mindful eating lessons.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>Yoga & meditation sessions tailored to all levels.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>
                  Optional doctor consultation concept (add-on) to personalize the plan.
                </span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">What makes us different</h2>
            <p className="mt-4 text-slate-600">
              At Doctors Farms, we focus on slow-living experiences. Every meal is made from the farm’s harvest and
              you’re invited to help seed, harvest, and prepare the food you eat.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>
                  Organic farm-to-table meals sourced from our own gardens.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>Simple accommodations with modern comfort and natural design.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                  ✓
                </span>
                <span>Light digital footprint so you can unplug and reset.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
