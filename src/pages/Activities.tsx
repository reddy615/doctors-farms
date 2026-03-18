const activities = [
  {
    title: "Farming Experience",
    description:
      "Join a guided tour of the organic gardens and help with seasonal harvesting and planting.",
    icon: "🚜",
  },
  {
    title: "Yoga & Meditation",
    description:
      "Daily guided sessions for all levels, set in quiet, nature-filled spaces.",
    icon: "🧘‍♂️",
  },
  {
    title: "Campfire Evenings",
    description:
      "Gather around a cozy fire with herbal teas, local stories, and acoustic music.",
    icon: "🔥",
  },
  {
    title: "Nature Walks",
    description:
      "Explore nearby trails, bird-watching spots, and peaceful riverside paths.",
    icon: "🌿",
  },
];

export default function Activities() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">Activities</h1>
        <p className="mt-4 text-lg text-slate-600">
          A calm schedule designed to help you recharge. Choose from gentle group activities or enjoy quiet time on your own.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {activities.map((activity) => (
          <div key={activity.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                {activity.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{activity.title}</h2>
            </div>
            <p className="mt-4 text-slate-600">{activity.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-slate-200 bg-brand-50 p-10">
        <h2 className="text-2xl font-semibold text-brand-900">Wellness Packages</h2>
        <p className="mt-4 text-slate-700">
          Each stay can be enhanced with a wellness package. Choose a plan that includes:
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Detox Plan</h3>
            <p className="mt-2 text-sm text-slate-600">Includes guided detox meals and herbal drinks.</p>
          </li>
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Restore Plan</h3>
            <p className="mt-2 text-sm text-slate-600">Includes daily yoga classes and mindfulness coaching.</p>
          </li>
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Comfort Plan</h3>
            <p className="mt-2 text-sm text-slate-600">Includes a welcome tea service and evening relaxation rituals.</p>
          </li>
          <li className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Consultation Add-on</h3>
            <p className="mt-2 text-sm text-slate-600">Optional wellness consultation to personalize your stay.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
