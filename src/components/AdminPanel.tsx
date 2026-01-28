import React, { useState } from 'react';
import { Plus, Upload, Trash2, Edit3, X, Package, Calendar, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Arrival } from '../lib/supabase';

type AdminPanelProps = {
  arrivals: Arrival[];
  onAdd: (arrival: Omit<Arrival, 'id' | 'created_at' | 'updated_at' | 'arrival_date'>) => void;
  onUpdate: (id: string, updates: Partial<Arrival>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBulkImport: (text: string) => void;
  onLoadSample: () => void;
};

export function AdminPanel({
  arrivals,
  onAdd,
  onUpdate,
  onRemove,
  onClear,
  onBulkImport,
  onLoadSample
}: AdminPanelProps) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim()) {
      alert('Last name is required');
      return;
    }
    if (!unitNumber.trim()) {
      alert('Unit number is required');
      return;
    }

    if (editingId) {
      onUpdate(editingId, {
        last_name: lastName.trim().toUpperCase(),
        first_name: firstName.trim().toUpperCase(),
        unit_number: unitNumber.trim(),
        notes: notes.trim()
      });
    } else {
      onAdd({
        last_name: lastName.trim().toUpperCase(),
        first_name: firstName.trim().toUpperCase(),
        unit_number: unitNumber.trim(),
        notes: notes.trim(),
        status: 'pending'
      });
    }

    setLastName('');
    setFirstName('');
    setUnitNumber('');
    setNotes('');
    setEditingId(null);
  };

  const handleEdit = (arrival: Arrival) => {
    setLastName(arrival.last_name);
    setFirstName(arrival.first_name || '');
    setUnitNumber(arrival.unit_number);
    setNotes(arrival.notes || '');
    setEditingId(arrival.id);
  };

  const handleCancelEdit = () => {
    setLastName('');
    setFirstName('');
    setUnitNumber('');
    setNotes('');
    setEditingId(null);
  };

  const handleBulkSubmit = () => {
    onBulkImport(bulkText);
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear ALL arrivals? This cannot be undone.')) {
      onClear();
    }
  };

  const pendingCount = arrivals.filter(a => a.status === 'pending').length;
  const checkedInCount = arrivals.filter(a => a.status === 'checked-in').length;
  const noShowCount = arrivals.filter(a => a.status === 'no-show').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Arrivals Management</h1>
              <p className="text-slate-300 text-sm">Front Desk Administration Panel</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-base sm:text-lg font-semibold text-slate-700">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-amber-50 border border-amber-200 px-3 sm:px-5 py-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <span className="text-xl sm:text-2xl font-bold text-amber-700">{pendingCount}</span>
              </div>
              <div className="text-xs text-amber-600 font-medium mt-1">Pending</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 sm:px-5 py-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span className="text-xl sm:text-2xl font-bold text-emerald-700">{checkedInCount}</span>
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Checked In</div>
            </div>
            <div className="bg-red-50 border border-red-200 px-3 sm:px-5 py-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="text-xl sm:text-2xl font-bold text-red-600">{noShowCount}</span>
              </div>
              <div className="text-xs text-red-500 font-medium mt-1">No Show</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 sm:px-5 py-3 rounded-xl text-center">
              <div className="text-xl sm:text-2xl font-bold text-slate-700">{arrivals.length}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    Edit Arrival
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add New Arrival
                  </>
                )}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="SMITH"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="JOHN"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Unit # <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="VIP, late arrival, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                      {editingId ? (
                        <>
                          <Edit3 className="w-5 h-5" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add Arrival
                        </>
                      )}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <hr className="my-6 border-slate-200" />

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Bulk Import
                </button>
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Load Sample Data
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-600" />
                  Today's Arrivals ({arrivals.length})
                </h2>
              </div>

              {arrivals.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No arrivals yet</p>
                  <p className="text-sm mt-2">Add arrivals using the form or click "Load Sample Data"</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {arrivals.map((arrival) => (
                    <div
                      key={arrival.id}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all ${
                        arrival.status === 'checked-in' ? 'bg-emerald-50/50' :
                        arrival.status === 'no-show' ? 'bg-red-50/50 opacity-70' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-bold text-slate-800">
                            {arrival.last_name}, {arrival.first_name || '—'}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-lg font-mono font-bold">
                            {arrival.unit_number}
                          </span>
                          {arrival.notes && (
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium">
                              {arrival.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <select
                          value={arrival.status}
                          onChange={(e) => onUpdate(arrival.id, { status: e.target.value as Arrival['status'] })}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold border-2 cursor-pointer transition-all ${
                            arrival.status === 'pending' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                            arrival.status === 'checked-in' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                            'border-red-300 bg-red-50 text-red-700'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="checked-in">Checked In</option>
                          <option value="no-show">No Show</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleEdit(arrival)}
                          className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(arrival.id)}
                          className="p-2.5 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Upload className="w-6 h-6 text-slate-600" />
              Bulk Import Arrivals
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Paste your list below. Format: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Last, First - Unit#</code>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 h-48 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder={`Anderson, Michael - 1205\nChen, Sarah - 2301\nGarcia, Carlos - 1847`}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleBulkSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => { setShowBulkModal(false); setBulkText(''); }}
                className="px-6 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
