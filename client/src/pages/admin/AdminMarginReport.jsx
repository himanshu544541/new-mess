import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { PieChart, TrendingUp, DollarSign, Users, Utensils, Percent, ShieldCheck, ArrowUpRight } from 'lucide-react';

const AdminMarginReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMarginReport = async () => {
    try {
      const res = await api.get('/admin/margin-report');
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch margin report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarginReport();
  }, []);

  const summary = data?.summary;
  const unit = data?.unitEconomics;
  const stats = data?.platformStats;

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Financial Margin Report</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Net platform yield: Student Gross Collections − Vendor Accrued Payouts − Gateway Processing Fees
            </p>
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
        ) : (
          <div className="space-y-8">
            {/* Top 4 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Gross Revenue */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total Student Collections
                </span>
                <div className="text-3xl font-black text-gray-900">
                  ₹{summary?.grossRevenueRupees?.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-xs text-gray-500">gross payments received</div>
              </div>

              {/* Vendor Accruals */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Vendor Accrued Costs (₹60/meal)
                </span>
                <div className="text-3xl font-black text-amber-600">
                  ₹{summary?.vendorAccruedRupees?.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {summary?.disbursedPayoutsRupees > 0 && `(₹${summary?.disbursedPayoutsRupees.toLocaleString('en-IN')} already paid out)`}
                </div>
              </div>

              {/* Gateway Fees */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Gateway Processing Fee ({summary?.gatewayFeePercent}%)
                </span>
                <div className="text-3xl font-black text-rose-600">
                  ₹{summary?.estimatedGatewayFeeRupees?.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-xs text-gray-500">Cashfree estimated cut</div>
              </div>

              {/* Net Profit Margin */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  Net Platform Margin
                </span>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{summary?.netPlatformMarginRupees?.toLocaleString('en-IN') || 0}
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{summary?.netMarginPercentage}% Net Margin</span>
                </div>
              </div>
            </div>

            {/* Per-Meal Unit Economics Breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="border-b pb-4 border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Per-Meal Unit Economics Breakdown</h2>
                  <p className="text-xs text-gray-500">Transparent mathematical derivation of platform revenue</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  60 Meals / Student / Mo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] text-gray-500 font-semibold uppercase">1. Student Fee</span>
                  <div className="text-xl font-black text-gray-900">₹{unit?.studentPerMealRupees}</div>
                  <div className="text-[10px] text-gray-400">₹3,800 / 60 meals</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                  <span className="text-[11px] text-amber-800 font-semibold uppercase">2. Vendor Payout</span>
                  <div className="text-xl font-black text-amber-700">-₹{unit?.vendorRateRupees}</div>
                  <div className="text-[10px] text-amber-600">to partner mess</div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1">
                  <span className="text-[11px] text-rose-800 font-semibold uppercase">3. Gateway Fee (2%)</span>
                  <div className="text-xl font-black text-rose-700">-₹{unit?.gatewayFeeRupees}</div>
                  <div className="text-[10px] text-rose-600">payment processing</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
                  <span className="text-[11px] text-emerald-800 font-semibold uppercase">4. Net Profit</span>
                  <div className="text-xl font-black text-emerald-600">+₹{unit?.netMarginPerMealRupees}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">platform retained / meal</div>
                </div>
              </div>
            </div>

            {/* Platform Operational Volume Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Verified Students</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats?.totalStudents || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Active Subscriptions</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">{stats?.totalActiveSubscriptions || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Partner Messes</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats?.totalVendors || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Total Meals Served</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalMealsServed || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarginReport;

