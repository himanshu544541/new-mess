import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { ShieldCheck, CheckCircle2, XCircle, FileText, User, Store, GraduationCap, AlertCircle, ExternalLink, Search } from 'lucide-react';

const AdminVerifications = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, userId: null, userName: '', reason: '' });
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'pending' ? '/admin/pending-users' : '/admin/all-users';
      const res = await api.get(endpoint);
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch verification list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: 'approved' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (user) => {
    setRejectModal({
      open: true,
      userId: user._id,
      userName: user.name,
      reason: ''
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert('Please specify a rejection reason for the applicant.');
      return;
    }
    setActionLoading(rejectModal.userId);
    try {
      await api.patch(`/admin/users/${rejectModal.userId}/status`, {
        status: 'rejected',
        rejectionReason: rejectModal.reason.trim()
      });
      setRejectModal({ open: false, userId: null, userName: '', reason: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">User Verification & Approvals</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review onboarding requests from students and partner messes to unlock dining features
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Review ({activeTab === 'pending' ? users.length : '...'})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Accounts
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table / Card Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Pending Verifications</h3>
          <p className="text-xs text-gray-500 mt-1">All student and vendor applications have been reviewed!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Applicant & Role</th>
                  <th className="px-6 py-3.5">Verification Details</th>
                  <th className="px-6 py-3.5">Proof / Licence</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => {
                  const isStudent = u.role === 'student';
                  const isVendor = u.role === 'vendor';
                  const details = u.details;

                  return (
                    <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isStudent ? 'bg-blue-100 text-blue-700' : isVendor ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {isStudent ? <GraduationCap className="w-4 h-4" /> : isVendor ? <Store className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                            <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 text-xs">
                        {isStudent && details && (
                          <div className="space-y-0.5">
                            <div><span className="text-gray-400">College:</span> <strong className="text-gray-800">{details.college}</strong></div>
                            <div><span className="text-gray-400">Hostel/PG:</span> {details.hostelOrPg}</div>
                            <div><span className="text-gray-400">Phone:</span> {details.phone}</div>
                          </div>
                        )}
                        {isVendor && details && (
                          <div className="space-y-0.5">
                            <div><span className="text-gray-400">Mess:</span> <strong className="text-gray-800">{details.name}</strong></div>
                            <div><span className="text-gray-400">Address:</span> {details.address}</div>
                            <div><span className="text-gray-400">Timings:</span> L: {details.timings?.lunch} | D: {details.timings?.dinner}</div>
                          </div>
                        )}
                        {!details && <span className="text-gray-400 italic">No extra profile</span>}
                      </td>

                      {/* Proof Document */}
                      <td className="px-6 py-4 text-xs">
                        {isStudent && details?.idProofUrl ? (
                          <a
                            href={`http://localhost:5000${details.idProofUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View ID Proof</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400" />
                          </a>
                        ) : isVendor && details?.fssaiNumber ? (
                          <div className="font-mono text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md inline-block border border-amber-200">
                            FSSAI: {details.fssaiNumber}
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.status}
                        </span>
                        {u.rejectionReason && (
                          <div className="text-[11px] text-rose-600 mt-1 max-w-xs italic truncate" title={u.rejectionReason}>
                            "{u.rejectionReason}"
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(u._id)}
                              disabled={actionLoading === u._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {u.status !== 'rejected' && (
                            <button
                              onClick={() => handleOpenReject(u)}
                              disabled={actionLoading === u._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <XCircle className="w-5 h-5" />
              <span>Reject Registration</span>
            </div>
            <p className="text-xs text-gray-600">
              State the reason for rejecting <strong>{rejectModal.userName}</strong>. This note will be shown to the applicant so they can correct their documents.
            </p>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. Uploaded student ID is blurred or does not show expiry year."
              className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal({ open: false, userId: null, userName: '', reason: '' })}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminVerifications;

