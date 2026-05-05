import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../config/api";
import AdminLogin from "../components/AdminLogin";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  roomType?: string;
  pricePerNight?: string;
  stay: string;
  message: string;
  status: string;
  createdAt: string;
  payment: Record<string, any> | null;
};

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [admins, setAdmins] = useState<Array<{id:string;name:string;email:string}>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is authenticated in localStorage
    const auth = localStorage.getItem("adminAuth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    // Password is validated in AdminLogin component
    localStorage.setItem("adminAuth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    navigate("/");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [inquiriesRes, adminsRes] = await Promise.all([
          apiFetch('/api/inquiries', { method: 'GET' }),
          apiFetch('/api/admins', { method: 'GET' }),
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
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Provide user-friendly error messages
        if (errorMessage.includes('Failed to fetch')) {
          setError('Server not reachable. Please check if the API server is running.');
        } else if (errorMessage.includes('Could not load')) {
          setError(errorMessage);
        } else {
          setError('Failed to load admin data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  const filteredInquiries = inquiries.filter((inquiry) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
      inquiry.id,
      inquiry.name,
      inquiry.email,
      inquiry.roomType || "",
      inquiry.pricePerNight || "",
      inquiry.stay,
      inquiry.status,
      inquiry.message,
      new Date(inquiry.createdAt).toLocaleString(),
    ].some((value) => value.toLowerCase().includes(query));
  });

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-semibold text-slate-900">Admin: Booking Inquiries</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {loading && <div className="mt-6 text-sm text-blue-700">Loading inquiries...</div>}
      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="inquiry-search" className="block text-sm font-medium text-slate-700">
              Search inquiries
            </label>
            <input
              id="inquiry-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, room type, status, or ID"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <p className="mt-2 text-xs text-slate-500">
              Showing {filteredInquiries.length} of {inquiries.length} inquiries.
            </p>
          </div>

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
                <th className="px-4 py-3 text-left font-medium">Room type</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Stay</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={8}>
                    {inquiries.length === 0 ? "No inquiries found." : "No inquiries match your search."}
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{inquiry.id}</td>
                    <td className="px-4 py-3">{inquiry.name}</td>
                    <td className="px-4 py-3">{inquiry.email}</td>
                    <td className="px-4 py-3">{inquiry.roomType || '-'}</td>
                    <td className="px-4 py-3">{inquiry.pricePerNight || '-'}</td>
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
