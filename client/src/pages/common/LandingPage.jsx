import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, QrCode, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Building2 } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>One Universal Pass for All Partner Hostels & PGs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Eat at <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Any Mess</span> with One Monthly Subscription
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          No more getting locked into a single hostel mess food menu. Pay ₹3,800/month, scan a dynamic QR code at any verified mess, and enjoy daily variety.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register/student"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Join as a Student</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/register/vendor"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Register Your Mess</span>
          </Link>
        </div>
      </section>

      {/* Value Model / Economics Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1 space-y-3">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">Transparent Economics</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Fair & Predictable Dining Math</h2>
              <p className="text-sm text-slate-300">
                Stored in integer paise to avoid rounding discrepancies. Every meal is verified by QR code.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-semibold mb-1">Student Pays</div>
                <div className="text-2xl font-black text-white">₹3,800</div>
                <div className="text-[11px] text-emerald-400 mt-1">60 meals (2 meals/day)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">₹63.33 per meal</div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-semibold mb-1">Partner Mess Gets</div>
                <div className="text-2xl font-black text-amber-400">₹60.00</div>
                <div className="text-[11px] text-amber-300 mt-1">per meal actually served</div>
                <div className="text-[11px] text-slate-400 mt-0.5">vs old ₹58.33 avg</div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-semibold mb-1">Platform Margin</div>
                <div className="text-2xl font-black text-indigo-400">₹3.33</div>
                <div className="text-[11px] text-indigo-300 mt-1">per meal managed</div>
                <div className="text-[11px] text-slate-400 mt-0.5">~₹199.8 / student / mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

