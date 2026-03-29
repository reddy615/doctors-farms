import { useEffect, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  stay: string;
  message: string;
  status: string;
  createdAt: string;
  payment: Record<string, any> | null;
};

export default function Admin() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [admins, setAdmins] = useState<Array<{id:string;name:string;email:string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [inquiriesRes, adminsRes] = await Promise.all([
          fetch('http://localhost:5000/api/inquiries'),
          fetch('http://localhost:5000/api/admins'),
        ]);

        const inquiriesJson = await inquiriesRes.json().catch(() => null);
        const adminsJson = await adminsRes.json().catch(() => null);

        if (!inquiriesRes.ok || !inquiriesJson?.success) {
          throw new Error(inquiriesJson?.error || 'Could not load inquiries');
        }

        if (!adminsRes.ok || !adminsJson?.success) {
          throw new Error(adminsJson?.error || 'Could not load admins');
        }

        setInquiries(inquiriesJson.inquiries || []);
        setAdmins(adminsJson.admins || []);
      } catch (err) {
        console.error('Failed to load data', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-semibold text-slate-900">Admin: Booking Inquiries</h1>

      {loading && <div className="mt-6 text-sm text-blue-700">Loading inquiries...</div>}
      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-2xl font-semibold text-slate-900">Admin list</h2>
            <p className="text-sm text-slate-600 mb-3">Admin contacts that receive inquiry notifications:</p>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {admins.length === 0 ? (
                <li>No admins configured.</li>
              ) : (
                admins.map((admin) => (
                  <li key={admin.id}>
                    {admin.name} &lt;{admin.email}&gt;
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Stay</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {inquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{inquiry.id}</td>
                    <td className="px-4 py-3">{inquiry.name}</td>
                    <td className="px-4 py-3">{inquiry.email}</td>
                    <td className="px-4 py-3">{inquiry.stay}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold text-white "
                        style={{ backgroundColor: inquiry.status === 'paid' ? '#16a34a' : inquiry.status === 'payment_initiated' ? '#f59e0b' : '#3b82f6' }}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(inquiry.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
      )}
    </div>
  );
}
