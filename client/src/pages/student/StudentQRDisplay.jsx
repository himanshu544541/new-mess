import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { QrCode, RefreshCw, ShieldCheck, Clock, Utensils, AlertTriangle, ArrowLeft, GraduationCap } from 'lucide-react';

const StudentQRDisplay = () => {
  const [qrData, setQrData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchQR = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/checkins/generate-qr');
      setQrData(res.data);
      setSecondsLeft(60);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate dining QR. Ensure you have an active subscription.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, []);

  // 60-second countdown timer that triggers auto-refresh when reaching 0
  useEffect(() => {
    if (secondsLeft <= 0) {
      fetchQR();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] font-mono text-gray-400">
          Slot: <strong className="text-gray-700 capitalize">{qrData?.currentSlot || 'meal'}</strong>
        </span>
      </div>

      {error ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Unable to Generate Pass</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              to="/student/subscribe"
              className="inline-block py-2.5 px-5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm"
            >
              Subscribe to Universal Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden relative">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center relative">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold backdrop-blur-sm mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Fraud Dynamic Token</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{qrData?.student?.name}</h1>
            <p className="text-xs text-white/80 mt-0.5">{qrData?.student?.college}</p>
          </div>

          {/* QR Code Presentation Box */}
          <div className="p-8 text-center space-y-6">
            <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-lg shadow-indigo-100">
              {loading || !qrData ? (
                <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <QRCodeSVG
                  value={qrData.qrToken}
                  size={220}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
              )}
            </div>

            {/* Live Countdown Progress Ring */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Expires in:</span>
                <span className={`font-mono text-sm font-bold ${secondsLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`}>
                  {secondsLeft}s
                </span>
              </div>

              <button
                onClick={fetchQR}
                disabled={refreshing}
                title="Refresh token now"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Warning / Anti-Screenshot Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 text-left space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active 60-Second Security Token</span>
              </div>
              <p className="text-amber-800/90 leading-tight">
                Screenshots will be rejected by the mess scanner because this token expires in 60s. Hold your screen up at the counter.
              </p>
            </div>

            {/* Remaining Meals Pill */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <div className="text-left">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Remaining Balance</span>
                <strong className="text-gray-900 text-sm">{qrData?.subscription?.mealsRemaining} Meals Left</strong>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-semibold rounded-lg text-xs">
                {qrData?.currentSlot?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQRDisplay;

