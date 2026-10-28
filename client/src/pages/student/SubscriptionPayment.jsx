import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Utensils, AlertCircle, RefreshCw, Zap } from 'lucide-react';

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.get('/subscriptions/pricing');
        setPricing(res.data);
      } catch (err) {
        setError('Failed to fetch platform subscription pricing.');
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const handleInitiatePayment = async () => {
    setProcessing(true);
    setError('');
    try {
      // Create order via backend (backend enforces server config amount in paise)
      const res = await api.post('/payments/create-order');
      setOrder(res.data);

      // In sandbox mode without Cashfree JS popup, automatically simulate completion
      setTimeout(async () => {
        try {
          await api.post('/payments/simulate-sandbox-success', {
            orderId: res.data.orderId
          });
          setSuccess(true);
          setTimeout(() => {
            navigate('/student');
          }, 2000);
        } catch (simErr) {
          setError(simErr.response?.data?.error || 'Payment simulation failed.');
          setProcessing(false);
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment session.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal PG & Hostel Dining Pass</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Activate Monthly Dining</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          One transparent monthly payment gives you 60 fresh meals across any partner mess in town.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden relative">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Official Student Plan</span>
            <h2 className="text-2xl font-black mt-0.5">30-Day Universal Pass</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">₹{pricing?.studentMonthlyFeeRupees?.toLocaleString('en-IN') || '3,800'}</div>
            <div className="text-xs text-indigo-200">per month (all taxes incl.)</div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>60 Total Meals</strong> (2 fresh meals/day for 30 consecutive days)</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>₹63.33 per meal</strong> — unmatched value vs ordering online</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Dine Anywhere</strong> — valid at all partner messes with QR scan</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Fraud-Proof Dynamic QR</strong> with real-time meal balance tracking</span>
            </div>
          </div>

          {/* Pricing Math Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-gray-800 uppercase tracking-wider">Pricing Breakdown</div>
            <div className="flex justify-between text-gray-600">
              <span>Total Pass Cost:</span>
              <span className="font-semibold text-gray-900">₹{pricing?.studentMonthlyFeeRupees || 3800}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Valid For:</span>
              <span>30 Days (60 Meals)</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment Mode:</span>
              <span className="text-indigo-600 font-semibold">Cashfree Sandbox Gateway (UPI/Card/NetBanking)</span>
            </div>
          </div>

          {/* Payment CTA */}
          {success ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">Payment Successful!</h3>
              <p className="text-xs text-emerald-700">
                Your 30-day subscription (60 meals) has been activated. Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <button
              onClick={handleInitiatePayment}
              disabled={processing}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Cashfree Sandbox Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{pricing?.studentMonthlyFeeRupees || 3800} via Cashfree Sandbox</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          )}

          <div className="text-center text-[11px] text-gray-400">
            🔒 Sandbox Test Environment • No real money is charged.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;

