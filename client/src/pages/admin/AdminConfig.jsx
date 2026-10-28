import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { Sliders, Save, CheckCircle2, AlertCircle, RefreshCw, Calculator, IndianRupee } from 'lucide-react';

const AdminConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    studentMonthlyFeeRupees: 3800,
    vendorRatePerMealRupees: 60,
    mealsPerMonth: 60,
    cycleDays: 30,
    gatewayFeePercent: 2.0
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      const c = res.data.config;
      setConfig(c);
      setFormData({
        studentMonthlyFeeRupees: c.studentMonthlyFeePaise / 100,
        vendorRatePerMealRupees: c.vendorRatePerMealPaise / 100,
        mealsPerMonth: c.mealsPerMonth,
        cycleDays: c.cycleDays,
        gatewayFeePercent: c.gatewayFeePercent || 2.0
      });
    } catch (err) {
      setError('Failed to fetch pricing config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/admin/config', formData);
      setConfig(res.data.config);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Live Unit Economics Calculation
  const studentRatePerMeal = (formData.studentMonthlyFeeRupees / (formData.mealsPerMonth || 60));
  const vendorPayout = Number(formData.vendorRatePerMealRupees || 60);
  const gatewayCut = (studentRatePerMeal * Number(formData.gatewayFeePercent || 2)) / 100;
  const platformMarginPerMeal = studentRatePerMeal - vendorPayout - gatewayCut;

  return (
    <div>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Pricing & Economics Config</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Edit system rates stored dynamically in database (integer paise). Never hardcoded.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="font-bold text-base text-gray-900 border-b pb-3 border-gray-100">
                Core Financial Parameters
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Student Monthly Pass (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      name="studentMonthlyFeeRupees"
                      required
                      value={formData.studentMonthlyFeeRupees}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Default: ₹3,800.00</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Vendor Rate per Meal (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      name="vendorRatePerMealRupees"
                      required
                      value={formData.vendorRatePerMealRupees}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Default: ₹60.00 / meal</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Meals per Month
                  </label>
                  <input
                    type="number"
                    name="mealsPerMonth"
                    required
                    value={formData.mealsPerMonth}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Default: 60 meals</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Cycle Duration (Days)
                  </label>
                  <input
                    type="number"
                    name="cycleDays"
                    required
                    value={formData.cycleDays}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Default: 30 days</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Gateway Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="gatewayFeePercent"
                    required
                    value={formData.gatewayFeePercent}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Default: 2.0%</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save Pricing Configuration'}</span>
                </button>
              </div>
            </form>

            {/* Live Economic Preview */}
            <div className="lg:col-span-1 bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>Live Unit Economics</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Student Pays / Meal:</span>
                    <span className="font-bold text-white">₹{studentRatePerMeal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Mess Owner Gets / Meal:</span>
                    <span className="font-bold text-amber-400">-₹{vendorPayout.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Gateway Fee ({formData.gatewayFeePercent}%):</span>
                    <span className="font-bold text-rose-400">-₹{gatewayCut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-700 text-sm">
                    <span className="font-semibold text-emerald-300">Net Platform Profit:</span>
                    <span className="font-black text-emerald-400">
                      ₹{platformMarginPerMeal.toFixed(2)} / meal
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                  Per student monthly platform profit at full meal consumption:
                  <strong className="block text-white text-xs mt-0.5">
                    ₹{(platformMarginPerMeal * (formData.mealsPerMonth || 60)).toFixed(2)} / student / mo
                  </strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                * Stored internally as integer paise to prevent precision errors.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConfig;

