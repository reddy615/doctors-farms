import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../config/api";
import AdminLogin from "../components/AdminLogin";
import DateCalendarPicker from "../components/DateCalendarPicker";
import { useBlockedDates } from "../hooks/useBlockedDates";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  roomType?: string;
  pricePerNight?: string;
  stay: string;
  checkIn?: string;
  checkOut?: string;
  phone?: string;
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
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { blockedDates, loading: blockedDatesLoading, error: blockedDatesError, saveBlockedDates } = useBlockedDates();
  const normalizeSearchText = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9@._-]/g, '');
  const extractInquiryId = (value: string) => {
    const match = value.match(/inq[_-]?\d+(?:[_-]\d+)?/i);
    return match ? normalizeSearchText(match[0]) : '';
  };
  const formatDateTime = (val?: string) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const parts = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).formatToParts(d);

      const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
      const date = `${get('day')} ${get('month')} ${get('year')}`.trim();
      const time = `${get('hour')}:${get('minute')} ${get('dayPeriod')}`.trim();
      return `${date}, ${time} IST`;
    } catch {
      return val;
    }
  };

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

  const handleBlockedDatesChange = async (dates: string[]) => {
    try {
      await saveBlockedDates(dates);
    } catch (error) {
      console.error('Failed to update blocked dates', error);
      setError(error instanceof Error ? error.message : 'Failed to update blocked dates');
    }
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
    const query = normalizeSearchText(searchTerm.trim());
    if (!query) return true;
    const extractedId = extractInquiryId(searchTerm);

    if (extractedId && normalizeSearchText(inquiry.id).includes(extractedId)) {
      return true;
    }

    return [
      inquiry.id,
      inquiry.name,
      inquiry.email,
      inquiry.roomType || "",
      inquiry.pricePerNight || "",
      inquiry.stay,
      inquiry.status,
      inquiry.message,
      formatDateTime(inquiry.createdAt),
    ].some((value) => normalizeSearchText(value).includes(query));
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Blocked dates calendar</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select any dates you want to block. Those dates will be disabled in booking screens.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBlockedDatesChange([])}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear blocked dates
              </button>
            </div>

            <div className="mt-4">
              {blockedDatesLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Loading blocked dates...
                </div>
              ) : (
                <DateCalendarPicker
                  title="Blocked dates"
                  helperText="Click dates to toggle them on or off."
                  mode="multiple"
                  selectedDates={blockedDates}
                  onChange={handleBlockedDatesChange}
                  theme="admin"
                />
              )}
            </div>

            {blockedDatesError && <p className="mt-3 text-sm text-amber-700">{blockedDatesError}</p>}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="inquiry-search" className="block text-sm font-medium text-slate-700">
              Search inquiries
            </label>
            <input
              id="inquiry-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoComplete="off"
              spellCheck={false}
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
                <th className="px-4 py-3 text-left font-medium">S.No</th>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Room type</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Check-in / Check-out</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={9}>
                    {inquiries.length === 0 ? "No inquiries found." : "No inquiries match your search."}
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry, index) => (
                  <tr key={inquiry.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{inquiry.id}</td>
                    <td className="px-4 py-3">{inquiry.name}</td>
                    <td className="px-4 py-3">{inquiry.email}</td>
                    <td className="px-4 py-3">{inquiry.roomType || '-'}</td>
                    <td className="px-4 py-3">{inquiry.pricePerNight || '-'}</td>
                    <td className="px-4 py-3">{(inquiry as any).checkIn ? `${formatDateTime((inquiry as any).checkIn)} → ${formatDateTime((inquiry as any).checkOut) || '-'}` : formatDateTime(inquiry.stay) || inquiry.stay}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold text-white "
                        style={{ backgroundColor: inquiry.status === 'paid' ? '#16a34a' : inquiry.status === 'payment_initiated' ? '#f59e0b' : '#3b82f6' }}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(inquiry.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        title="View details"
                        onClick={() => { setSelectedInquiry(inquiry); setShowDetails(true); }}
                        className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
                      >
                        {/* Eye icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details modal */}
        {showDetails && selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetails(false)} />
            <div className="relative z-10 mx-4 max-w-2xl rounded-lg bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">Inquiry Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  aria-label="Close"
                  title="Close"
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
                <div><strong>ID:</strong> {selectedInquiry.id}</div>
                <div><strong>Name:</strong> {selectedInquiry.name}</div>
                <div><strong>Email:</strong> {selectedInquiry.email}</div>
                <div><strong>Phone:</strong> {(selectedInquiry as any).phone || 'Not provided'}</div>
                <div><strong>Room type:</strong> {selectedInquiry.roomType || 'Not selected'}</div>
                <div><strong>Price per night:</strong> {selectedInquiry.pricePerNight || 'Not provided'}</div>
                <div className="flex gap-6">
                  <div><strong>Check-in:</strong> {formatDateTime((selectedInquiry as any).checkIn) || formatDateTime(selectedInquiry.stay) || 'Not provided'}</div>
                  <div><strong>Check-out:</strong> {formatDateTime((selectedInquiry as any).checkOut) || 'Not provided'}</div>
                </div>
                <div><strong>Message:</strong>
                  <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 mt-1">{selectedInquiry.message}</div>
                </div>
                <div><strong>Status:</strong> {selectedInquiry.status}</div>
                <div><strong>Created:</strong> {formatDateTime(selectedInquiry.createdAt)}</div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowDetails(false)} className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </>
      )}
    </div>
  );
}
