import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      // Route based on role
      if (data.user.role === 'admin') {
        navigate('/admin/verifications');
      } else if (data.user.role === 'vendor') {
        navigate('/vendor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or network failure.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setFormData({
      email: 'admin@centralmess.in',
      password: 'AdminPassword123!'
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to Your Account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Access universal dining, QR meal scans, or mess dashboard
          </p>
        </div>

        {/* Demo Quick Fill for testing convenience */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Demo Autofill
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={fillAdmin}
              className="text-left text-xs bg-white hover:bg-indigo-50 hover:border-indigo-300 p-2 rounded-xl border border-gray-200 transition-colors flex justify-between items-center"
            >
              <div>
                <span className="font-semibold text-purple-700">Admin Account</span>
                <div className="text-[11px] text-gray-400">admin@centralmess.in</div>
              </div>
              <span className="text-[11px] bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded">Fill</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@college.edu or vendor@mess.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-5 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Are you a student?{' '}
            <Link to="/register/student" className="font-semibold text-indigo-600 hover:underline">
              Register as Student
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Mess Owner or Caterer?{' '}
            <Link to="/register/vendor" className="font-semibold text-amber-600 hover:underline">
              Partner as a Mess Vendor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

