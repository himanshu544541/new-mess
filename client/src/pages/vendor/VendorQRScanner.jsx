import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import { CheckCircle2, XCircle, Camera, QrCode, ArrowLeft, RefreshCw, Clock, Utensils, IndianRupee, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorQRScanner = () => {
  const [scanResult, setScanResult] = useState(null); // { status: 'ALLOWED' | 'DENIED', data: ... }
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [scannerActive, setScannerActive] = useState(true);
  const scannerRef = useRef(null);

  const fetchRecent = async () => {
    try {
      const res = await api.get('/checkins/recent');
      setRecentScans(res.data.checkIns || []);
    } catch (err) {
      console.error('Failed to load recent checkins', err);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  // Process the QR token with backend verification
  const handleProcessToken = async (tokenString) => {
    if (!tokenString || loading) return;

    setLoading(true);
    setScannerActive(false);

    try {
      const res = await api.post('/checkins/scan', { qrToken: tokenString.trim() });
      setScanResult({
        status: 'ALLOWED',
        data: res.data
      });
      fetchRecent();
    } catch (err) {
      const errResponse = err.response?.data;
      setScanResult({
        status: 'DENIED',
        data: {
          reason: errResponse?.reason || err.message || 'Verification failed. Check token or dining status.'
        }
      });
    } finally {
      setLoading(false);
      // Auto-resume scanner after 4 seconds
      setTimeout(() => {
        setScanResult(null);
        setScannerActive(true);
      }, 4000);
    }
  };

  // Initialize html5-qrcode scanner
  useEffect(() => {
    let html5QrcodeScanner;
    try {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          handleProcessToken(decodedText);
        },
        (error) => {
          // ignore ongoing scan frame errors
        }
      );
    } catch (e) {
      console.warn('Camera scanner initialization error', e);
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleProcessToken(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/vendor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendor Portal</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Earn ₹60.00 / Verified Scan
        </span>
      </div>

      {/* Prominent ALLOWED / DENIED Visual Overlay */}
      {scanResult && (
        <div className="animate-in fade-in duration-200">
          {scanResult.status === 'ALLOWED' ? (
            <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-2xl border-4 border-emerald-400 text-center space-y-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border-2 border-white/40">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight">ALLOWED</div>
              <p className="text-emerald-100 text-sm font-semibold">{scanResult.data.message}</p>

              <div className="bg-white/10 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5 border border-white/15">
                <div className="flex justify-between">
                  <span className="text-emerald-200">Student Name:</span>
                  <span className="font-bold text-white text-sm">{scanResult.data.student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200">College / Hostel:</span>
                  <span className="text-white">{scanResult.data.student?.college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200">Meal Slot:</span>
                  <span className="font-bold text-amber-300">{scanResult.data.mealSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-200">Student Remaining Meals:</span>
                  <span className="text-white font-mono">{scanResult.data.mealsRemaining} / {scanResult.data.totalMeals}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/20">
                  <span className="text-emerald-200">Your Mess Payout:</span>
                  <span className="font-black text-amber-300 text-sm">+₹60.00</span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-200">Next scan ready in a moment...</div>
            </div>
          ) : (
            <div className="bg-rose-600 rounded-3xl p-8 text-white shadow-2xl border-4 border-rose-400 text-center space-y-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border-2 border-white/40">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight">DENIED</div>
              <div className="bg-white/10 rounded-2xl p-4 max-w-md mx-auto text-xs border border-white/15">
                <span className="text-rose-200 block uppercase font-bold text-[10px] tracking-wider mb-1">Reason:</span>
                <p className="text-sm font-semibold text-white">{scanResult.data.reason}</p>
              </div>
              <div className="text-[11px] text-rose-200">Scanner resuming automatically...</div>
            </div>
          )}
        </div>
      )}

      {/* Camera Scanner Container */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Live Camera QR Scanner</h2>
            <p className="text-xs text-gray-500">Hold the student's dynamic 60-second QR code in front of the lens</p>
          </div>
          {loading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full animate-pulse border border-amber-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Check-in...</span>
            </span>
          )}
        </div>

        {/* Video feed mount */}
        <div className="max-w-sm mx-auto overflow-hidden rounded-2xl border border-gray-200 bg-slate-900">
          <div id="qr-reader" className="w-full"></div>
        </div>

        {/* Manual Token Fallback for Desktop Testing */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Desktop & Manual Token Testing</span>
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste generated JWT token string here to simulate scan..."
              className="flex-1 p-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              Verify Scan
            </button>
          </form>
        </div>
      </div>

      {/* Recent Meal Check-ins Log */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Today's Recorded Check-ins</h3>
          <span className="text-xs text-gray-400">{recentScans.length} meals served</span>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No student check-ins recorded yet today. Scan a QR above to begin!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {recentScans.slice(0, 10).map((ci) => (
              <div key={ci._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900 block">{ci.student?.name || 'Student'}</strong>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {ci.mealSlot?.toUpperCase()} • {new Date(ci.scannedAt).toLocaleTimeString('en-IN', { hour12: true })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">+₹60.00</span>
                  <span className="block text-[10px] text-gray-400 capitalize">{ci.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorQRScanner;

