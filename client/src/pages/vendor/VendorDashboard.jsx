import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Store,
  ShieldCheck,
  QrCode,
  TrendingUp,
  IndianRupee,
  Settings,
  Utensils,
  Download,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const VendorDashboard = () => {
  const { user, mess } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/vendor/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch vendor statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/vendor/export-csv', { responseType: 'blob' });
      // Create download link
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meal_audit_${mess?.name || 'mess'}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download CSV audit file.');
    } finally {
      setDownloading(false);
    }
  };

  const metrics = stats?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Vendor Hero Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Partner Mess</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/vendor/scan"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Student QR</span>
              </Link>
              <Link
                to="/vendor/manage"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold shadow-md hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span>Profile & Menus</span>
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {mess?.name || 'Your Mess'}
          </h1>
          <p className="text-white/80 text-sm max-w-xl mt-1">
            Managed by {user?.name} • FSSAI: {mess?.fssaiNumber} • {mess?.address}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Contract Rate</div>
              <div className="text-lg font-bold">₹60.00 / meal</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Mess Status</div>
              <div className="text-lg font-bold">{mess?.isOpen ? '🟢 Open for Dining' : '🔴 Closed'}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Key Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Meals Today */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Served Today</div>
          <div className="text-2xl font-black text-gray-900">{metrics?.mealsToday ?? 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium">
            +₹{((metrics?.mealsToday || 0) * 60).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Meals This Week */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">This Week</div>
          <div className="text-2xl font-black text-gray-900">{metrics?.mealsThisWeek ?? 0}</div>
          <div className="text-[11px] text-gray-500">meals served</div>
        </div>

        {/* Meals This Month */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">This Month</div>
          <div className="text-2xl font-black text-gray-900">{metrics?.mealsThisMonth ?? 0}</div>
          <div className="text-[11px] text-gray-500">monthly cycle</div>
        </div>

        {/* Unique Students */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unique Diners</div>
          <div className="text-2xl font-black text-indigo-600">{metrics?.uniqueStudents ?? 0}</div>
          <div className="text-[11px] text-gray-500">students reached</div>
        </div>

        {/* Estimated Unpaid Payout */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Estimated Payout</div>
          <div className="text-2xl font-black text-amber-900">
            ₹{metrics?.estimatedUnpaidRupees?.toLocaleString('en-IN') ?? 0}
          </div>
          <div className="text-[10px] text-amber-700">unsettled earnings</div>
        </div>

        {/* Total Settled to Date */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Total Paid Out</div>
          <div className="text-2xl font-black text-emerald-900">
            ₹{metrics?.totalPaidRupees?.toLocaleString('en-IN') ?? 0}
          </div>
          <div className="text-[10px] text-emerald-700">transferred to bank</div>
        </div>
      </div>

      {/* CSV Export & Actions Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Per-Meal Audit Log & CSV Export</h3>
            <p className="text-xs text-gray-500">
              Download complete raw check-in records (student names, timestamp, slot, ₹60 rate) for your accounts
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={downloading}
          className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Preparing CSV...' : 'Download CSV Audit Log'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Check-in Stream */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-gray-900 text-base">Recent Meal Check-ins</h3>
            </div>
            <Link to="/vendor/scan" className="text-xs font-semibold text-indigo-600 hover:underline">
              Open QR Scanner →
            </Link>
          </div>

          {!stats?.recentCheckIns || stats.recentCheckIns.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No student meals recorded yet. Start scanning student QR codes to see records here.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 text-xs">
              {stats.recentCheckIns.map((ci) => (
                <div key={ci._id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-900">{ci.student?.name || 'Verified Student'}</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {ci.date} • {new Date(ci.scannedAt).toLocaleTimeString('en-IN', { hour12: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm">+₹60.00</span>
                    <span className="block text-[10px] text-gray-400 uppercase font-semibold">{ci.mealSlot}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Payout Settlement History */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-base">Settlement History</h3>
          </div>

          {!stats?.payoutHistory || stats.payoutHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 leading-relaxed">
              No settlements processed yet.<br />Admin processes payouts on scheduled settlement dates.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.payoutHistory.map((p) => (
                <div key={p._id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">₹{(p.amountPaise / 100).toLocaleString('en-IN')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {p.totalMeals} meals ({new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()})
                  </div>
                  {p.transactionReference && (
                    <div className="text-[10px] font-mono text-gray-400">Ref: {p.transactionReference}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
