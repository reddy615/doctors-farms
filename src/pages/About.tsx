export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">About Doctors Farms</h1>
        <p className="mt-4 text-lg text-slate-600">
          Doctors Farms was founded on the belief that nature is the best medicine. Our resort blends
          intentional wellness with fresh, organic living in a serene farm setting.
        </p>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Why “Doctors”?</h2>
          <p className="mt-4 text-slate-600">
            The name “Doctors Farms” reflects our focus on health and wellness. Here, every stay is
            designed to support rest, recovery, and mindful nourishment. We combine gentle movement,
            clean food, and time in nature to help guests feel balanced again.
          </p>
          <p className="mt-4 text-slate-600">
            While we are not a medical facility, our team includes wellness guides and nutrition
            enthusiasts who craft each experience with wellbeing in mind.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">What to expect</h2>
          <ul className="mt-4 space-y-4 text-slate-600">
            <li>
              <strong className="text-slate-800">Fresh air every day:</strong> Open-air dining, walking trails, and plenty of
              greenery.
            </li>
            <li>
              <strong className="text-slate-800">Simple, high-quality food:</strong> Meals crafted from our gardens and
              local ingredients.
            </li>
            <li>
              <strong className="text-slate-800">Comfort without clutter:</strong> Accommodations designed to feel restful and
              grounded.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
