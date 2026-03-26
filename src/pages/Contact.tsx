import { useState } from "react";

const PaymentForm = ({ inquiryId, name, email }: { inquiryId: string; name: string; email: string }) => {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 20000, // ₹20,000
          name,
          email,
          inquiryId,
        })
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = data.paymentUrl; // Redirect to PhonePe
      } else {
        alert('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed');
    }
    setProcessing(false);
  };

  return (
    <div className="mt-6">
      <button
        onClick={handlePayment}
        disabled={processing}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 disabled:opacity-50"
      >
        {processing ? "Processing..." : "Pay with PhonePe ₹20,000"}
      </button>
    </div>
  );
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", stay: "" });
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');
  const [mailStatus, setMailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [mailError, setMailError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMailStatus('sending');
    setMailError('');

    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const text = await response.text();
      let result: any;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'raw response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to send inquiry.');
      }

      setMailStatus('sent');
      setInquiryId(result.inquiryId || '');
      setSubmitted(true);
    } catch (error) {
      console.error('Mail send error:', error);
      setMailStatus('error');
      setMailError(error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold text-slate-900">Contact & Booking</h1>
        <p className="mt-4 text-lg text-slate-600">
          Reach out with questions or send a quick booking inquiry. We'll respond within 24 hours.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Contact details</h2>
            <dl className="mt-6 space-y-4 text-sm text-slate-700">
              <div>
                <dt className="font-medium text-slate-900">Phone</dt>
                <dd className="mt-1">+91 99555 75969</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Email</dt>
                <dd className="mt-1">doctorsfarms686@gmail.com</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Location</dt>
                <dd className="mt-1">
                  <a href="https://maps.app.goo.gl/11rBFWM74UWENMZS8" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Near vikas college road, Nunna, Andhra Pradesh, India - 521212
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-8">
              <iframe
                title="Doctors Farms location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.1166896541!2d80.6853249!3d16.6225173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x0!2zMTbCsDM3JzIxLjEiTiA4MMKwNDEnMDcuMiJF!5e0!3m2!1sen!2sin!4v1700150000000"
                className="h-56 w-full rounded-2xl border border-slate-200"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Booking inquiry</h2>
            <p className="mt-2 text-sm text-slate-600">
              Share a few details and we'll be in touch about availability and packages.
            </p>
            {mailStatus === 'sending' && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Sending inquiry...
              </div>
            )}
            {mailStatus === 'error' && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                Failed to send inquiry: {mailError}
              </div>
            )}
            {submitted ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-900">
                  Thanks for reaching out! Please complete your payment to confirm the booking.
                </div>
                <PaymentForm inquiryId={inquiryId} name={form.name} email={form.email} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Preferred stay</label>
                  <input
                    name="stay"
                    value={form.stay}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    placeholder="e.g. 3 nights, 2 adults"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    placeholder="Tell us what you're looking for..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700"
                >
                  Send inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
