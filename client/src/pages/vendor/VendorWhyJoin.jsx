import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, CheckCircle2, ShieldCheck, QrCode, ArrowRight, IndianRupee, Users, Award, Calculator } from 'lucide-react';

const VendorWhyJoin = () => {
  const [dailyMeals, setDailyMeals] = useState(120);

  const oldRatePerMeal = 58.33;
  const newRatePerMeal = 60.00;

  const monthlyOldRevenue = Math.round(dailyMeals * 30 * oldRatePerMeal);
  const monthlyNewRevenue = Math.round(dailyMeals * 30 * newRatePerMeal);
  const additionalMonthlyIncome = monthlyNewRevenue - monthlyOldRevenue;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero Pitch */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          <span>Vendor Partner Economics</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Earn More per Meal. Zero Credit Risk. Guaranteed Weekly Payouts.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Stop chasing students for unpaid monthly mess bills. Centralized Mess pays you <strong>₹60.00</strong> for every single verified meal served, directly into your bank account.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            to="/register/vendor"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
          >
            <span>Partner Your Mess Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all"
          >
            Vendor Login
          </Link>
        </div>
      </div>

      {/* Interactive Revenue Calculator */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-slate-800">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <Calculator className="w-5 h-5" />
            <span>Interactive Profit Estimator</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold">See How Much More You Earn</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Traditional hostel dining forces students into rigid ₹3,500 monthly contracts (~₹58.33/meal). Under our universal network, you earn <strong>₹60.00 flat</strong> on every meal scan with zero collection friction.
              </p>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Estimated Meals Served per Day:</span>
                  <span className="text-amber-400 text-sm">{dailyMeals} meals / day</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={dailyMeals}
                  onChange={(e) => setDailyMeals(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>30 meals</span>
                  <span>200 meals</span>
                  <span>400 meals</span>
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Traditional Single Mess (₹58.33)</div>
                  <div className="text-xl font-bold text-slate-300">₹{monthlyOldRevenue.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500">monthly gross</div>
                </div>
                <div>
                  <div className="text-[11px] text-amber-400 font-medium">Centralized Mess (₹60.00)</div>
                  <div className="text-xl font-bold text-emerald-400">₹{monthlyNewRevenue.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-emerald-400/80">assured payout</div>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300 font-semibold">Extra Annual Income</div>
                  <div className="text-2xl font-black text-white">
                    +₹{(additionalMonthlyIncome * 12).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-400">
                  +₹{additionalMonthlyIncome.toLocaleString('en-IN')} / month
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * Based on 30 operational days per month. Settlement calculated strictly on recorded QR check-ins.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">₹60 Assured per Meal</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Higher rate per meal than traditional monthly hostel mess passes (₹58.33). You keep 100% of your earnings for meals served.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">High Student Footfall</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Attract students living in non-mess PGs and neighboring hostels who want menu variety without paying double fees.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Fraud-Proof QR Scans</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Dynamic 60-second tokens and duplicate checks prevent screenshot fraud. Only genuine students with active meal balance can eat.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Guaranteed Settlements</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Platform collects student fees upfront into escrow. Payouts are transferred automatically with transparent downloadable CSV logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorWhyJoin;

