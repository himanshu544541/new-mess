import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RatingModal from '../../components/RatingModal';
import { Store, Search, Clock, Utensils, MapPin, CheckCircle2, XCircle, Award, Sparkles, Filter, Star } from 'lucide-react';

const MessList = () => {
  const { user } = useAuth();
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [activeMenuSlot, setActiveMenuSlot] = useState({}); // { [messId]: 'lunch' | 'dinner' }
  const [ratingTargetMess, setRatingTargetMess] = useState(null);

  const fetchMesses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/messes', {
        params: {
          search: search.trim() || undefined,
          openOnly: openOnly ? 'true' : undefined
        }
      });
      setMesses(res.data.messes);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load partner messes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMesses();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, openOnly]);

  const toggleSlot = (messId, slot) => {
    setActiveMenuSlot(prev => ({ ...prev, [messId]: slot }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Universal Mess Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Partner Dining Messes</h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Your single monthly subscription works at all verified messes below. Browse today's freshly prepared menus, verify operating hours, and drop in for a meal!
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mess name or locality..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setOpenOnly(!openOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              openOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Open Dining Only</span>
            {openOnly && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Messes Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : messes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No partner messes found</h3>
          <p className="text-xs text-gray-500 mt-1">Try broadening your search term or disabling the "Open Dining Only" filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messes.map((m) => {
            const currentSlot = activeMenuSlot[m._id] || 'lunch';
            const menuItems = currentSlot === 'lunch' ? (m.menu?.lunch || []) : (m.menu?.dinner || []);
            const timingText = currentSlot === 'lunch' ? m.timings?.lunch : m.timings?.dinner;

            return (
              <div
                key={m._id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Bar */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-snug">{m.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{m.address}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase flex-shrink-0 ${
                        m.isOpen
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {m.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                      {m.description || 'Hygienic home-style food cooked fresh for college students.'}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 font-mono bg-gray-50 p-2 rounded-xl">
                      <span>FSSAI Lic: {m.fssaiNumber}</span>
                      <span className="text-amber-600 font-bold">★ {m.avgRating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>

                  {/* Menu Tabs Section */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSlot(m._id, 'lunch')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            currentSlot === 'lunch'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Lunch
                        </button>
                        <button
                          onClick={() => toggleSlot(m._id, 'dinner')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            currentSlot === 'dinner'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Dinner
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{timingText}</span>
                      </div>
                    </div>

                    {/* Dish Tags */}
                    <div className="flex flex-wrap gap-1.5 min-h-[70px]">
                      {menuItems.map((dish, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium"
                        >
                          {dish}
                        </span>
                      ))}
                      {menuItems.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No dishes listed for this slot today.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer status pill & Rate button */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                  <span>Included in Universal Pass</span>
                  {user?.role === 'student' ? (
                    <button
                      onClick={() => setRatingTargetMess(m)}
                      className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 hover:underline"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Rate Mess</span>
                    </button>
                  ) : (
                    <span className="font-semibold text-indigo-600">Scan QR at counter</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        mess={ratingTargetMess}
        isOpen={Boolean(ratingTargetMess)}
        onClose={() => setRatingTargetMess(null)}
        onRatingSubmitted={fetchMesses}
      />
    </div>
  );
};

export default MessList;

