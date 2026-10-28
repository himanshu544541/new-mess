import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/common/LandingPage';
import Login from './pages/auth/Login';
import StudentRegister from './pages/auth/StudentRegister';
import VendorRegister from './pages/auth/VendorRegister';
import StudentDashboard from './pages/student/StudentDashboard';
import SubscriptionPayment from './pages/student/SubscriptionPayment';
import StudentQRDisplay from './pages/student/StudentQRDisplay';
import MessList from './pages/student/MessList';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorMessManage from './pages/vendor/VendorMessManage';
import VendorQRScanner from './pages/vendor/VendorQRScanner';
import VendorWhyJoin from './pages/vendor/VendorWhyJoin';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminConfig from './pages/admin/AdminConfig';
import AdminSettlements from './pages/admin/AdminSettlements';
import AdminMarginReport from './pages/admin/AdminMarginReport';
import AdminCheckIns from './pages/admin/AdminCheckIns';
import AdminRatings from './pages/admin/AdminRatings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/student" element={<StudentRegister />} />
              <Route path="/register/vendor" element={<VendorRegister />} />
              <Route path="/messes" element={<MessList />} />
              <Route path="/why-join" element={<VendorWhyJoin />} />

              {/* Protected Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']} requireApproval={true}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/subscribe"
                element={
                  <ProtectedRoute allowedRoles={['student']} requireApproval={true}>
                    <SubscriptionPayment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/qr"
                element={
                  <ProtectedRoute allowedRoles={['student']} requireApproval={true}>
                    <StudentQRDisplay />
                  </ProtectedRoute>
                }
              />

              {/* Protected Vendor Routes */}
              <Route
                path="/vendor"
                element={
                  <ProtectedRoute allowedRoles={['vendor']} requireApproval={true}>
                    <VendorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/manage"
                element={
                  <ProtectedRoute allowedRoles={['vendor']} requireApproval={true}>
                    <VendorMessManage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/scan"
                element={
                  <ProtectedRoute allowedRoles={['vendor']} requireApproval={true}>
                    <VendorQRScanner />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={<Navigate to="/admin/verifications" replace />}
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminVerifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/config"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settlements"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminSettlements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/margin"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminMarginReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/checkins"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminCheckIns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ratings"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                    <AdminRatings />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
