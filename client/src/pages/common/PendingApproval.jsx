import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

const PendingApproval = () => {
  const { user, profile, mess, refreshUser } = useAuth();
  const [checking, setChecking] = React.useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshUser();
    setTimeout(() => setChecking(false), 500);
  };

  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className={`p-6 text-white ${isRejected ? 'bg-gradient-to-r from-rose-600 to-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {isRejected ? <AlertTriangle className="w-8 h-8 text-white" /> : <Clock className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isRejected ? 'Application Not Approved' : 'Verification Under Review'}
              </h2>
              <p className="text-white/80 text-xs mt-0.5">
                {isRejected ? 'Action required on your account' : 'Account status: Pending Admin Review'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {isRejected ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800">
              <span className="font-semibold block mb-1">Reason provided by Admin:</span>
              <p className="italic">"{user?.rejectionReason || 'Uploaded proof could not be verified or was illegible.'}"</p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                Hello <strong className="text-gray-900">{user?.name}</strong>! Thank you for registering with Centralized Mess System.
              </p>
              <p>
                To maintain dining safety and prevent subscription fraud, an administrator must review your submitted details and verify your credentials before your account is unlocked.
              </p>
            </div>
          )}

          {/* Submitted details summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs space-y-2">
            <div className="font-semibold text-gray-700 uppercase tracking-wider mb-2">Submitted Profile</div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Registered Role</span>
              <span className="font-semibold text-gray-800 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Email</span>
              <span className="font-semibold text-gray-800">{user?.email}</span>
            </div>

            {user?.role === 'student' && profile && (
              <>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">College / University</span>
                  <span className="font-semibold text-gray-800">{profile.college}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Hostel / PG</span>
                  <span className="font-semibold text-gray-800">{profile.hostelOrPg}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-semibold text-gray-800">{profile.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">ID / Residence Proof</span>
                  <span className="text-indigo-600 flex items-center gap-1 font-medium">
                    <FileText className="w-3.5 h-3.5" /> Uploaded
                  </span>
                </div>
              </>
            )}

            {user?.role === 'vendor' && mess && (
              <>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Mess Name</span>
                  <span className="font-semibold text-gray-800">{mess.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">FSSAI Licence</span>
                  <span className="font-semibold text-gray-800">{mess.fssaiNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Address</span>
                  <span className="font-semibold text-gray-800">{mess.address}</span>
                </div>
              </>
            )}
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking Status...' : 'Check Approval Status Now'}
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Approvals are usually reviewed within 1-2 hours during business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

