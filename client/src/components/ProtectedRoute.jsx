import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PendingApproval from '../pages/common/PendingApproval';

const ProtectedRoute = ({ children, allowedRoles = [], requireApproval = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-gray-500">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl shadow-md border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Unauthorized</h2>
        <p className="text-sm text-gray-600 mb-4">Your role ({user.role}) does not have permission to access this page.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Enforce approval for non-admin accounts
  if (requireApproval && user.role !== 'admin' && user.status !== 'approved') {
    return <PendingApproval />;
  }

  return children;
};

export default ProtectedRoute;

