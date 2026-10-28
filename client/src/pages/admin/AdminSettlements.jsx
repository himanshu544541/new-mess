import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { DollarSign, Calendar, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

const AdminSettlements = () => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [proposals, setProposals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [disbursing, setDisbursing] = useState(null);
  const [prepaidFlags, setPrepaidFlags] = useState({});
  const [references, setReferences] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    setCalculating(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/admin/settlements/calculate', { startDate, endDate });
      setProposals(res.data.settlementProposals);
      if (res.data.settlementProposals.length === 0) {
        setMessage('No unsettled meals found in the selected date range.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate settlements.');
    } finally {
      setCalculating(false);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const res = await api.get('/admin/settlements/all');
      setPayouts(res.data.payouts);
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    }
  };

  useEffect(() => {
    handleCalculate();
    fetchPayoutHistory();
  }, []);

  const handleDisburse = async (proposal) => {
    setDisbursing(proposal.messId);
    setError('');
    try {
      const isPrepaid = Boolean(prepaidFlags[proposal.messId]);
      const ref = references[proposal.messId] || `CMS_NEFT_${Date.now()}`;

      const res = await api.post('/admin/settlements/disburse', {
        messId: proposal.messId,
        startDate,
        endDate,
        isPrepaid,
        transactionReference: ref
      });

      setMessage(res.data.message);
      // Re-calculate and refresh history
      handleCalculate();
      fetchPayoutHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse settlement.');
    } finally {
      setDisbursing(null);
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Partner Mess Settlements</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Calculate verified QR meal payouts (check-ins × ₹60.00) and disburse weekly vendor earnings
            </p>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm text-xs">
            <span className="text-gray-400 font-semibold pl-2">Period:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            />
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {calculating ? 'Calculating...' : 'Recalculate'}
            </button>
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

        {/* Proposals Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Pending Settlement Proposals ({proposals.length})
          </h2>

          {proposals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-400">
              No unsettled check-ins found in the selected period. All vendor check-ins have been paid out!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((prop) => {
                const isPrepaid = Boolean(prepaidFlags[prop.messId]);

                return (
                  <div
                    key={prop.messId}
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{prop.messName}</h3>
                          <p className="text-xs text-gray-400">Vendor: {prop.vendorName}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                          {prop.unsettledMeals} Meals
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Calculation:</span>
                          <span>{prop.unsettledMeals} meals × ₹60.00</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-slate-200">
                          <span>Disbursement Amount:</span>
                          <span className="text-emerald-600 font-black">
                            ₹{prop.totalAmountRupees.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Prepaid Trust Checkbox */}
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-purple-200 bg-purple-50/50 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isPrepaid}
                          onChange={(e) =>
                            setPrepaidFlags({ ...prepaidFlags, [prop.messId]: e.target.checked })
                          }
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div>
                          <span className="font-semibold text-purple-900 block">
                            Prepaid Trust Payout (Week 1)
                          </span>
                          <span className="text-[10px] text-purple-700">
                            Disburse upfront before complete billing cycle to build vendor trust
                          </span>
                        </div>
                      </label>

                      {/* Reference Input */}
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">
                          Bank Transfer Reference / UTR
                        </label>
                        <input
                          type="text"
                          value={references[prop.messId] || ''}
                          onChange={(e) =>
                            setReferences({ ...references, [prop.messId]: e.target.value })
                          }
                          placeholder="e.g. NEFT09823471"
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDisburse(prop)}
                      disabled={disbursing === prop.messId}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                    >
                      {disbursing === prop.messId ? (
                        <span>Processing Disbursement...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark as Paid & Disburse</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historical Settled Payouts Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Historical Disbursed Payouts</h2>
            <span className="text-xs text-gray-400">{payouts.length} past settlements</span>
          </div>

          {payouts.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No historical settlements found. Disburse a pending proposal above to create records.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 uppercase text-[10px] text-gray-400 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Mess & Vendor</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Meals</th>
                    <th className="px-4 py-3">Disbursed Amount</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Disbursed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {p.mess?.name || 'Mess Partner'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">{p.totalMeals} meals</td>
                      <td className="px-4 py-3 font-black text-emerald-600">
                        ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        {p.isPrepaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Prepaid (Trust)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-400">{p.transactionReference}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettlements;

