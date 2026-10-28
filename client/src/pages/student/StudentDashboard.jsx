import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { QrCode, Utensils, CheckCircle, ShieldCheck, Sparkles, CreditCard, Clock, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/my-status');
      setSubData(res.data);
    } catch (err) {
      setError('Failed to fetch subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const hasActive = subData?.hasActiveSubscription;
  const sub = subData?.subscription;
  const mealsRemaining = sub ? sub.mealsRemaining : 0;
  const totalMeals = sub ? sub.totalMeals : 60;
  const percentage = Math.round((mealsRemaining / totalMeals) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Student Pass</span>
            </div>

            {hasActive && (
              <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Universal Pass Active</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/80 text-sm max-w-xl mt-1">
            {profile?.college} • {profile?.hostelOrPg}
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Active Plan</div>
              <div className="text-lg font-bold">
                {hasActive ? '30-Day Universal Pass' : 'No Active Plan'}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Meals Remaining</div>
              <div className="text-lg font-bold">
                {hasActive ? `${mealsRemaining} / ${totalMeals}` : '0 / 60'}
              </div>
            </div>

            {hasActive && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Days Left</div>
                <div className="text-lg font-bold">{subData.daysRemaining} Days</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Action Prompt */}
      {!loading && !hasActive && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Step 2: Activate Universal Dining</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Ready to Start Eating?</h2>
            <p className="text-white/90 text-xs sm:text-sm max-w-xl">
              Pay ₹3,800 to unlock 60 universal meals for the 30-day cycle. Eat at any partner mess with a single QR scan.
            </p>
          </div>

          <Link
            to="/student/subscribe"
            className="px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 flex-shrink-0 group"
          >
            <span>Activate Pass (₹3,800)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Active Subscription Details Card */}
      {hasActive && sub && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Universal Pass Meal Balance</h2>
              <p className="text-xs text-gray-500">
                Cycle: {new Date(sub.cycleStartDate).toLocaleDateString()} to {new Date(sub.cycleEndDate).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">{mealsRemaining}</span>
              <span className="text-xs text-gray-400"> / {totalMeals} meals left</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{sub.mealsUsed} meals used</span>
              <span>{percentage}% remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/messes"
          className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Browse Partner Messes
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Explore daily menus, special dishes, lunch/dinner timings, and open dining halls near your hostel or PG.
            </p>
          </div>
        </Link>

        {hasActive ? (
          <Link
            to="/student/qr"
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Show Dining QR Code
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Live Token
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Open your 60-second auto-refreshing QR pass and show it at the mess counter for meal check-in.
              </p>
            </div>
          </Link>
        ) : (
          <Link
            to="/student/subscribe"
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Activate Pass to Unlock QR
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Subscribe to the 30-day universal meal pass to generate dynamic dining tokens.
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
