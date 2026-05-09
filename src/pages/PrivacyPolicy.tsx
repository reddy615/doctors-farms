export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-lg text-slate-600">
          This page explains how Doctors Farms Resort collects, uses, and protects the information you share with us.
        </p>
      </header>

      <div className="mt-12 space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
          <p className="mt-3 text-slate-600">
            We may collect your name, phone number, email address, booking details, inquiry messages, and any other
            information you choose to submit through our forms or WhatsApp contact links.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">How we use your information</h2>
          <p className="mt-3 text-slate-600">
            We use this information to respond to inquiries, manage reservations, provide customer support, improve our
            services, and share booking updates or payment-related communication when needed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Sharing and protection</h2>
          <p className="mt-3 text-slate-600">
            We do not sell your personal information. We may share information only with trusted service providers that
            help us operate the website, process payments, or deliver communications. We take reasonable steps to protect
            the data we collect, but no online system is completely secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-3 text-slate-600">
            If you have questions about this policy, please contact us through the website contact form or by WhatsApp.
          </p>
        </section>
      </div>
    </div>
  );
}