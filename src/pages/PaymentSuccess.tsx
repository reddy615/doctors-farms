export default function PaymentSuccess() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-8">
          <h1 className="text-3xl font-semibold text-green-900">Payment Successful!</h1>
          <p className="mt-4 text-lg text-green-700">
            Thank you for your payment. Your booking has been confirmed.
          </p>
          <p className="mt-2 text-sm text-green-600">
            You will receive a confirmation email shortly with your booking details.
          </p>
        </div>
      </div>
    </div>
  );
}