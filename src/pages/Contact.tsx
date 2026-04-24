import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../config/api";
import { formatINR, rooms } from "../data/rooms";

const PaymentForm = ({ inquiryId, name, email, amount }: { inquiryId: string; name: string; email: string; amount: number }) => {
  const [processing, setProcessing] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handlePayment = async () => {
    setShowQr(true);
  };

  const handleOnlinePayment = async () => {
    setProcessing(true);
    try {
      const response = await apiFetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
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
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 disabled:opacity-50"
      >
        {`Pay ${formatINR(amount)}`}
      </button>

      {showQr && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">Scan QR to pay {formatINR(amount)}</p>
          <p className="mt-1 text-xs text-slate-600">After payment, share your transaction screenshot on WhatsApp for quick confirmation.</p>
          <img
            src="/phonepe-qr.png"
            alt="PhonePe payment QR code"
            className="mt-4 w-full max-w-xs rounded-xl border border-slate-200"
            loading="lazy"
          />
          <button
            onClick={handleOnlinePayment}
            disabled={processing}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {processing ? "Processing..." : "Or continue with PhonePe checkout"}
          </button>
        </div>
      )}
    </div>
  );
};

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", stay: "", roomType: "" });
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');
  const [mailStatus, setMailStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'pending'>('idle');
  const [mailError, setMailError] = useState('');
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'sent' | 'delayed' | 'pending' | null>(null);
  const [mailHealth, setMailHealth] = useState<{
    checked: boolean;
    healthy: boolean;
    message: string;
  }>({ checked: false, healthy: true, message: '' });
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);

  useEffect(() => {
    const checkMailHealth = async () => {
      try {
        const response = await apiFetch('/api/health/mail', { method: 'GET' });
        const result = await response.json();
        setMailHealth({
          checked: true,
          healthy: !!result?.success,
          message: result?.message || 'Mail service is ready.',
        });
      } catch (error) {
        setMailHealth({
          checked: true,
          healthy: false,
          message: error instanceof Error ? error.message : 'Unable to check mail service status.',
        });
      }
    };

    checkMailHealth();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  useEffect(() => {
    const selectedRoom = rooms.find((room) => room.name === form.roomType);
    setSelectedRoomPrice(selectedRoom?.pricePerNight ?? 0);
  }, [form.roomType]);

  useEffect(() => {
    const roomTypeFromQuery = searchParams.get('roomType');
    if (!roomTypeFromQuery) return;

    const roomExists = rooms.some((room) => room.name === roomTypeFromQuery);
    if (!roomExists) return;

    setForm((prev) => ({
      ...prev,
      roomType: prev.roomType || roomTypeFromQuery,
    }));
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMailStatus('sending');
    setMailError('');

    try {
      console.log('Sending form data:', form);
      const response = await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          roomPrice: selectedRoomPrice,
          pricePerNight: selectedRoomPrice ? `${formatINR(selectedRoomPrice)} / night` : '',
        }),
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Raw response:', text);

      let result: any;
      try {
        result = text ? JSON.parse(text) : {};
        console.log('Parsed result:', result);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'raw response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !result.success) {
        console.error('API error - response.ok:', response.ok, 'result.success:', result.success);
        
        // Show validation errors if available
        let errorMessage = result.error || result.message || 'Unable to send inquiry.';
        if (result.errors) {
          console.error('Validation errors:', result.errors);
          // Format validation errors for display
          const errorDetails = Object.entries(result.errors).map(([key, value]: any) => {
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
            return `${key}: ${value}`;
          }).join('\n');
          errorMessage = `${errorMessage}\n\nValidation errors:\n${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }

      setMailStatus('sent');
      setInquiryId(result.inquiryId || '');
      setEmailDeliveryStatus(result.emailStatus || 'sent');
      setSubmitted(true);
    } catch (error) {
      console.error('Mail send error:', error);
      setMailStatus('error');
      
      const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
      setMailError(errorMsg);
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
                <dt className="font-medium text-slate-900">WhatsApp</dt>
                <dd className="mt-1">
                  <a
                    href="https://wa.me/919955575969?text=Hello%20Doctors%20Farms%2C%20I%20would%20like%20to%20inquire%20about%20booking."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Message us on WhatsApp
                  </a>
                </dd>
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
            {mailHealth.checked && !mailHealth.healthy && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Mail service issue detected</p>
                <p className="mt-1">{mailHealth.message}</p>
              </div>
            )}
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
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                  <p className="text-sm text-green-900">
                    <strong>✓ Inquiry Received!</strong> Inquiry ID: {inquiryId}
                  </p>
                  {emailDeliveryStatus === 'sent' && (
                    <p className="mt-2 text-sm text-green-800">Confirmation email has been sent to {form.email}</p>
                  )}
                  {emailDeliveryStatus === 'delayed' && (
                    <p className="mt-2 text-sm text-yellow-800">Your inquiry is saved. Email confirmation may take a few minutes to arrive.</p>
                  )}
                  {emailDeliveryStatus === 'pending' && (
                    <p className="mt-2 text-sm text-yellow-800">Your inquiry is saved. We're processing your submission and will contact you shortly.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900">
                  <p className="font-medium">Next Step: Complete Payment</p>
                  <p className="mt-2">Please proceed with payment to confirm your booking reservation.</p>
                  {form.roomType && selectedRoomPrice > 0 && (
                    <p className="mt-2">{form.roomType}: {formatINR(selectedRoomPrice)} / night</p>
                  )}
                </div>
                <PaymentForm inquiryId={inquiryId} name={form.name} email={form.email} amount={selectedRoomPrice || rooms[0]?.pricePerNight || 0} />
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
                  <label className="block text-sm font-medium text-slate-700">Phone <span className="text-xs text-slate-500">(10 digits, e.g., +91 9876543210)</span></label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    placeholder="+91 9876543210 or 9876543210"
                    pattern="[\d\s+]{10,}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Room type</label>
                  <select
                    name="roomType"
                    value={form.roomType}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.name} value={room.name}>
                        {room.name} - {formatINR(room.pricePerNight)} / night
                      </option>
                    ))}
                  </select>
                  {selectedRoomPrice > 0 && (
                    <p className="mt-2 text-xs text-brand-700">Selected room price: {formatINR(selectedRoomPrice)} / night</p>
                  )}
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
                  <label className="block text-sm font-medium text-slate-700">Message <span className="text-xs text-slate-500">(any message)</span></label>
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
