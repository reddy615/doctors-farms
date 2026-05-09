export default function TermsConditions() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Terms & Conditions</h1>
        <p className="mt-4 text-lg text-slate-600">
          These terms govern the use of the Doctors Farms Resort website, booking enquiries, and related services.
        </p>
      </header>

      <div className="mt-12 space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Website use</h2>
          <p className="mt-3 text-slate-600">
            By using this website, you agree to use it only for lawful purposes and not to interfere with the security,
            performance, or availability of the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Bookings and enquiries</h2>
          <p className="mt-3 text-slate-600">
            Booking requests submitted through the website are not confirmed until our team acknowledges them. Availability,
            pricing, and stay details may change based on season, room type, and occupancy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Payments and cancellations</h2>
          <p className="mt-3 text-slate-600">
            Any payment instructions shared by our team should be followed carefully. Cancellation or refund terms, if
            applicable, will be communicated during the booking process or before payment confirmation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Changes to these terms</h2>
          <p className="mt-3 text-slate-600">
            We may update these terms from time to time. Continued use of the site after changes are posted means you
            accept the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}