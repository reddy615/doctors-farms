const diningHighlights = [
  {
    title: "Farm-to-table meals",
    description:
      "Enjoy fresh meals made from ingredients grown on the property, with seasonal menus that change daily.",
  },
  {
    title: "Organic breakfast spread",
    description:
      "Start your morning with fresh juices, homemade breads, and nutrient-rich smoothies.",
  },
  {
    title: "Herbal tea selection",
    description:
      "Relax with a curated selection of herbal teas and warm infusions made from our garden herbs.",
  },
  {
    title: "Culinary workshops",
    description:
      "Join occasional workshops to learn how to cook with local organic ingredients.",
  },
];

export default function Dining() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">Dining</h1>
        <p className="mt-4 text-lg text-slate-600">
          Our dining program is built around fresh, seasonal produce. Menus are designed to support wellness and provide
          nourishing energy.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {diningHighlights.map((highlight) => (
          <div key={highlight.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{highlight.title}</h2>
            <p className="mt-3 text-slate-600">{highlight.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-slate-200 bg-brand-50 p-10 shadow-sm">
        <h2 className="text-2xl font-semibold text-brand-900">Farm & Kitchen</h2>
        <p className="mt-4 text-slate-700">
          Our kitchen closely follows the growth cycle of the farm. You’ll see how the ingredients are harvested, then
          turned into balanced meals that feel like home.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          All dietary needs are considered. Let us know your preferences during booking so we can prepare a personalized
          meal plan.
        </p>
      </div>
    </div>
  );
}
