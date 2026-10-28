import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { Star, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRatings = async () => {
    try {
      const res = await api.get('/ratings/admin/all');
      setRatings(res.data.ratings || []);
    } catch (err) {
      setError('Failed to fetch private ratings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
            <Star className="w-6 h-6 fill-purple-600 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Private Dining Ratings & Feedback</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Strictly confidential. Only university administrators see individual student feedback; vendors see the overall average only.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-400">
            No student ratings submitted yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratings.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{r.mess?.name || 'Mess Partner'}</h3>
                      <p className="text-xs text-gray-400">Student: {r.student?.name || 'Student'}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            r.rating >= star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 italic">
                    "{r.comment || 'No written feedback provided.'}"
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t pt-2 border-gray-100 flex justify-between">
                  <span>Student ID: {r.student?._id}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRatings;

