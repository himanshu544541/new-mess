import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { ListChecks, Utensils, Search, CheckCircle2, Clock } from 'lucide-react';

const AdminCheckIns = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCheckIns = async () => {
    try {
      const res = await api.get('/admin/all-checkins');
      setCheckIns(res.data.checkIns);
    } catch (err) {
      setError('Failed to fetch check-ins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const filtered = checkIns.filter((ci) => {
    const s = search.toLowerCase();
    return (
      ci.student?.name?.toLowerCase().includes(s) ||
      ci.mess?.name?.toLowerCase().includes(s) ||
      ci.mealSlot?.toLowerCase().includes(s) ||
      ci.date?.includes(s)
    );
  });

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <ListChecks className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Platform-Wide Check-In Audit</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Real-time audit log of all student meal scans across all partner messes
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or mess..."
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-400">
            No check-in transactions found matching your criteria.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 uppercase text-[10px] text-gray-400 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Partner Mess</th>
                    <th className="px-6 py-3.5">Slot & Date</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Rate (INR)</th>
                    <th className="px-6 py-3.5 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((ci) => (
                    <tr key={ci._id} className="hover:bg-gray-50/70">
                      <td className="px-6 py-3.5">
                        <strong className="text-gray-900 block">{ci.student?.name || 'Student'}</strong>
                        <span className="text-[11px] text-gray-400">{ci.student?.email}</span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-800">
                        {ci.mess?.name || 'Mess'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 uppercase mr-1.5">
                          {ci.mealSlot}
                        </span>
                        <span className="font-mono text-gray-500">{ci.date}</span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 font-mono">
                        {new Date(ci.scannedAt).toLocaleTimeString('en-IN', { hour12: true })}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-900">
                        ₹{((ci.vendorRatePaise || 6000) / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ci.isPaidOut ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ci.isPaidOut ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCheckIns;

