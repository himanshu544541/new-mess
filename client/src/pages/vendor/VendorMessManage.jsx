import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Store, Clock, Utensils, Power, Plus, X, Save, CheckCircle2, AlertCircle, MapPin, Award } from 'lucide-react';

const VendorMessManage = () => {
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    fssaiNumber: '',
    lunchTiming: '',
    dinnerTiming: ''
  });

  // Menu items arrays
  const [lunchMenu, setLunchMenu] = useState([]);
  const [dinnerMenu, setDinnerMenu] = useState([]);
  const [newLunchItem, setNewLunchItem] = useState('');
  const [newDinnerItem, setNewDinnerItem] = useState('');

  const fetchMessProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messes/my/profile');
      const m = res.data.mess;
      setMess(m);
      setFormData({
        name: m.name || '',
        address: m.address || '',
        description: m.description || '',
        fssaiNumber: m.fssaiNumber || '',
        lunchTiming: m.timings?.lunch || '12:30 PM - 03:00 PM',
        dinnerTiming: m.timings?.dinner || '07:30 PM - 10:00 PM'
      });
      setLunchMenu(m.menu?.lunch || []);
      setDinnerMenu(m.menu?.dinner || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch mess information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessProfile();
  }, []);

  const handleToggleOpen = async () => {
    setToggling(true);
    try {
      const res = await api.patch('/messes/my/toggle-open');
      setMess({ ...mess, isOpen: res.data.isOpen });
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle dining status.');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/messes/my/profile', formData);
      setMess(res.data.mess);
      setMessage('Mess profile details updated successfully.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update mess details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/messes/my/menu', {
        lunch: lunchMenu,
        dinner: dinnerMenu
      });
      setMessage("Today's menu successfully published!");
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update menus.');
    } finally {
      setSaving(false);
    }
  };

  const addLunchItem = (e) => {
    e.preventDefault();
    if (newLunchItem.trim()) {
      setLunchMenu([...lunchMenu, newLunchItem.trim()]);
      setNewLunchItem('');
    }
  };

  const removeLunchItem = (idx) => {
    setLunchMenu(lunchMenu.filter((_, i) => i !== idx));
  };

  const addDinnerItem = (e) => {
    e.preventDefault();
    if (newDinnerItem.trim()) {
      setDinnerMenu([...dinnerMenu, newDinnerItem.trim()]);
      setNewDinnerItem('');
    }
  };

  const removeDinnerItem = (idx) => {
    setDinnerMenu(dinnerMenu.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Live Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mess?.name || 'My Mess'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage daily operating status, timings & today's special menus</p>
          </div>
        </div>

        {/* Live Open / Closed switch */}
        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
          <div className="text-right">
            <div className="text-xs font-bold text-gray-800">
              {mess?.isOpen ? 'MESS OPEN' : 'MESS CLOSED'}
            </div>
            <div className="text-[11px] text-gray-500">
              {mess?.isOpen ? 'Students can scan QR for meals' : 'Dining hall currently closed'}
            </div>
          </div>
          <button
            onClick={handleToggleOpen}
            disabled={toggling}
            className={`p-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              mess?.isOpen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{mess?.isOpen ? 'Close Dining' : 'Open Dining'}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Mess Details Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-base border-b pb-3 border-gray-100">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Mess Profile Info</span>
          </div>

          <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mess Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">FSSAI Licence Number</label>
              <input
                type="text"
                required
                value={formData.fssaiNumber}
                onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description / Tagline</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lunch Timing</label>
                <input
                  type="text"
                  value={formData.lunchTiming}
                  onChange={(e) => setFormData({ ...formData, lunchTiming: e.target.value })}
                  placeholder="12:30 PM - 03:00 PM"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Dinner Timing</label>
                <input
                  type="text"
                  value={formData.dinnerTiming}
                  onChange={(e) => setFormData({ ...formData, dinnerTiming: e.target.value })}
                  placeholder="07:30 PM - 10:00 PM"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-[11px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Mess Info</span>
            </button>
          </form>
        </div>

        {/* Right Column: Menu Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Today's Menu Items</h2>
                  <p className="text-xs text-gray-500">Students see these live items when browsing partner messes</p>
                </div>
              </div>
              <button
                onClick={handleSaveMenu}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Publish Menus</span>
              </button>
            </div>

            {/* Lunch Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-sm text-gray-800">Lunch Menu</span>
                  <span className="text-xs text-gray-400">({formData.lunchTiming})</span>
                </div>
                <span className="text-xs text-gray-400">{lunchMenu.length} items</span>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-2xl border border-gray-200">
                {lunchMenu.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeLunchItem(idx)}
                      className="text-amber-700 hover:text-amber-950 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {lunchMenu.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No lunch items added yet.</span>
                )}
              </div>

              {/* Add dish input */}
              <form onSubmit={addLunchItem} className="flex gap-2">
                <input
                  type="text"
                  value={newLunchItem}
                  onChange={(e) => setNewLunchItem(e.target.value)}
                  placeholder="e.g. Shahi Paneer, Jeera Rice, Gulab Jamun..."
                  className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-1 border border-amber-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Dinner Section */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="font-bold text-sm text-gray-800">Dinner Menu</span>
                  <span className="text-xs text-gray-400">({formData.dinnerTiming})</span>
                </div>
                <span className="text-xs text-gray-400">{dinnerMenu.length} items</span>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-2xl border border-gray-200">
                {dinnerMenu.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 text-xs font-semibold border border-indigo-200"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeDinnerItem(idx)}
                      className="text-indigo-700 hover:text-indigo-950 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {dinnerMenu.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No dinner items added yet.</span>
                )}
              </div>

              {/* Add dish input */}
              <form onSubmit={addDinnerItem} className="flex gap-2">
                <input
                  type="text"
                  value={newDinnerItem}
                  onChange={(e) => setNewDinnerItem(e.target.value)}
                  placeholder="e.g. Dal Tadka, Tawa Roti, Mix Veg..."
                  className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl flex items-center gap-1 border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMessManage;

