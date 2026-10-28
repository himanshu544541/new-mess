import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { UtensilsCrossed, LogOut, ShieldCheck, Clock, XCircle, Store, GraduationCap, Utensils, HelpCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><ShieldCheck className="w-3.5 h-3.5" /> Admin</span>;
      case 'vendor':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Store className="w-3.5 h-3.5" /> Mess Partner</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><GraduationCap className="w-3.5 h-3.5" /> Student</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 text-rose-600" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 text-amber-600" /> Pending Review</span>;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg leading-tight tracking-tight">Centralized Mess</div>
            <div className="text-[11px] text-gray-500 font-medium">Universal Dining System</div>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/messes"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5 text-indigo-600" />
            <span>Partner Messes</span>
          </Link>
          <Link
            to="/why-join"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-amber-600 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>Why Join as Vendor</span>
          </Link>
        </nav>

        {/* User Navigation / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Role & Status Pill */}
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                {user.role !== 'admin' && (
                  <div className="mt-0.5">
                    {getStatusBadge(user.status)}
                  </div>
                )}
              </div>

              {/* Navigation Links based on role */}
              <div className="flex items-center gap-2 border-l pl-3 ml-1 border-gray-200">
                {user.role === 'student' && (
                  <Link
                    to="/student"
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === 'vendor' && (
                  <>
                    <Link
                      to="/vendor"
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      Vendor Portal
                    </Link>
                    <Link
                      to="/vendor/manage"
                      className="hidden sm:inline-block px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      Menus
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin/verifications"
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-semibold"
                  >
                    Verification Queue
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register/student"
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
              >
                Join as Student
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
