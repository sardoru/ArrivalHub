import React, { useState, useMemo } from 'react';
import { Plus, Upload, Trash2, Edit3, X, Package, Calendar, Users, CheckCircle, Clock, XCircle, Shield, Phone, Mail, AlertCircle, Flag, Ban } from 'lucide-react';
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
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggingArrival, setFlaggingArrival] = useState<Arrival | null>(null);
  const [flagReason, setFlagReason] = useState('');

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
  const awaitingIdCount = arrivals.filter(a => a.signed_in_at && !a.id_verified && a.status === 'pending' && !a.is_flagged).length;
  const flaggedCount = arrivals.filter(a => a.is_flagged).length;

  const handleOpenFlagModal = (arrival: Arrival) => {
    setFlaggingArrival(arrival);
    setFlagReason(arrival.flag_reason || '');
    setShowFlagModal(true);
  };

  const handleSubmitFlag = () => {
    if (flaggingArrival && flagReason.trim()) {
      onUpdate(flaggingArrival.id, { 
        is_flagged: true, 
        flag_reason: flagReason.trim() 
      });
      setShowFlagModal(false);
      setFlaggingArrival(null);
      setFlagReason('');
    }
  };

  const handleClearFlag = (arrivalId: string) => {
    onUpdate(arrivalId, { is_flagged: false, flag_reason: '' });
  };

  // Sort arrivals: flagged at top, then signed-in awaiting ID, then by last name
  const sortedArrivals = useMemo(() => {
    return [...arrivals].sort((a, b) => {
      // Priority 0: Flagged guests at very top
      if (a.is_flagged && !b.is_flagged) return -1;
      if (!a.is_flagged && b.is_flagged) return 1;

      // Priority 1: Signed in but not ID verified (awaiting ID check)
      const aAwaitingId = a.signed_in_at && !a.id_verified && a.status === 'pending' && !a.is_flagged;
      const bAwaitingId = b.signed_in_at && !b.id_verified && b.status === 'pending' && !b.is_flagged;
      if (aAwaitingId && !bAwaitingId) return -1;
      if (!aAwaitingId && bAwaitingId) return 1;
      
      // Priority 2: Signed in and ID verified but not checked in
      const aIdVerified = a.signed_in_at && a.id_verified && a.status === 'pending' && !a.is_flagged;
      const bIdVerified = b.signed_in_at && b.id_verified && b.status === 'pending' && !b.is_flagged;
      if (aIdVerified && !bIdVerified) return -1;
      if (!aIdVerified && bIdVerified) return 1;

      // Priority 3: Pending arrivals
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;

      // Priority 4: Checked in
      if (a.status === 'checked-in' && b.status === 'no-show') return -1;
      if (a.status === 'no-show' && b.status === 'checked-in') return 1;

      // Within same priority, sort by signed_in_at (most recent first) or last_name
      if (aAwaitingId && bAwaitingId) {
        return new Date(b.signed_in_at!).getTime() - new Date(a.signed_in_at!).getTime();
      }
      
      return a.last_name.localeCompare(b.last_name);
    });
  }, [arrivals]);

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
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
            {flaggedCount > 0 && (
              <div className="bg-red-100 border-2 border-red-500 px-3 sm:px-5 py-3 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span className="text-xl sm:text-2xl font-bold text-red-700">{flaggedCount}</span>
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">Flagged</div>
              </div>
            )}
            {awaitingIdCount > 0 && (
              <div className="bg-orange-50 border-2 border-orange-400 px-3 sm:px-5 py-3 rounded-xl text-center animate-pulse">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <span className="text-xl sm:text-2xl font-bold text-orange-700">{awaitingIdCount}</span>
                </div>
                <div className="text-xs text-orange-600 font-medium mt-1">Verify ID</div>
              </div>
            )}
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
                  {sortedArrivals.map((arrival) => {
                    const isAwaitingId = arrival.signed_in_at && !arrival.id_verified && arrival.status === 'pending' && !arrival.is_flagged;
                    const isIdVerified = arrival.signed_in_at && arrival.id_verified && arrival.status === 'pending' && !arrival.is_flagged;
                    const isFlagged = arrival.is_flagged;
                    
                    return (
                      <div
                        key={arrival.id}
                        className={`px-6 py-4 transition-all ${
                          isFlagged
                            ? 'bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-600'
                            : isAwaitingId 
                            ? 'bg-gradient-to-r from-orange-100 to-amber-50 border-l-4 border-orange-500 animate-pulse' 
                            : isIdVerified
                            ? 'bg-gradient-to-r from-blue-50 to-slate-50 border-l-4 border-blue-500'
                            : arrival.status === 'checked-in' 
                            ? 'bg-emerald-50/50' 
                            : arrival.status === 'no-show' 
                            ? 'bg-red-50/50 opacity-70' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className="text-lg font-bold text-slate-800">
                                {arrival.last_name}, {arrival.first_name || '—'}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-lg font-mono font-bold">
                                {arrival.unit_number}
                              </span>
                              {isFlagged && (
                                <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                                  <Ban className="w-4 h-4" />
                                  DENIED - CHECK-IN BLOCKED
                                </span>
                              )}
                              {isAwaitingId && (
                                <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 animate-bounce">
                                  <Shield className="w-4 h-4" />
                                  VERIFY ID
                                </span>
                              )}
                              {isIdVerified && (
                                <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4" />
                                  ID VERIFIED
                                </span>
                              )}
                              {arrival.notes && (
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium">
                                  {arrival.notes}
                                </span>
                              )}
                            </div>
                            
                            {/* Flag reason for flagged guests */}
                            {isFlagged && arrival.flag_reason && (
                              <div className="bg-red-200/50 border border-red-300 rounded-lg px-3 py-2 mt-2 mb-2">
                                <p className="text-red-800 text-sm font-medium flex items-start gap-2">
                                  <Flag className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span><strong>Reason:</strong> {arrival.flag_reason}</span>
                                </p>
                              </div>
                            )}
                            
                            {/* Guest contact info for signed-in guests */}
                            {arrival.signed_in_at && (
                              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                {arrival.guest_phone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {arrival.guest_phone}
                                  </span>
                                )}
                                {arrival.guest_email && (
                                  <span className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {arrival.guest_email}
                                  </span>
                                )}
                                <span className="text-slate-400 text-xs">
                                  Signed in {new Date(arrival.signed_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Flagged guest actions */}
                            {isFlagged && (
                              <button
                                type="button"
                                onClick={() => handleClearFlag(arrival.id)}
                                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-300 transition-all flex items-center gap-2"
                              >
                                <X className="w-5 h-5" />
                                Clear Flag
                              </button>
                            )}
                            
                            {/* ID Verification button for signed-in guests (not flagged) */}
                            {isAwaitingId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdate(arrival.id, { id_verified: true })}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/25"
                                >
                                  <Shield className="w-5 h-5" />
                                  Verify ID
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFlagModal(arrival)}
                                  className="bg-red-100 text-red-600 px-3 py-2 rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-1.5"
                                >
                                  <Flag className="w-5 h-5" />
                                  Flag Issue
                                </button>
                              </>
                            )}
                            
                            {/* Check-in button - only after ID verified (not flagged) */}
                            {isIdVerified && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdate(arrival.id, { status: 'checked-in' })}
                                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                  Check In & Give Keys
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFlagModal(arrival)}
                                  className="bg-red-100 text-red-600 px-3 py-2 rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-1.5"
                                >
                                  <Flag className="w-5 h-5" />
                                  Flag
                                </button>
                              </>
                            )}
                            
                            {/* Status select for non-signed-in guests (not flagged) */}
                            {!arrival.signed_in_at && !isFlagged && (
                              <>
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
                                {arrival.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFlagModal(arrival)}
                                    className="p-2.5 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                    title="Flag Issue"
                                  >
                                    <Flag className="w-5 h-5" />
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Show status badge for checked-in guests who went through sign-in */}
                            {arrival.signed_in_at && arrival.status === 'checked-in' && !isFlagged && (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" />
                                Checked In
                              </span>
                            )}
                            
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
                      </div>
                    );
                  })}
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

      {showFlagModal && flaggingArrival && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Flag className="w-6 h-6 text-red-600" />
              Flag Guest Issue
            </h3>
            <div className="bg-slate-100 rounded-xl p-4 mb-4">
              <p className="text-slate-800 font-semibold text-lg">
                {flaggingArrival.last_name}, {flaggingArrival.first_name || '—'}
              </p>
              <p className="text-slate-500">Unit {flaggingArrival.unit_number}</p>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              This will <strong>block check-in</strong> for this guest. Please describe the issue:
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {['Name mismatch on ID', 'Underage guest', 'ID expired', 'Suspicious behavior', 'Not on reservation'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFlagReason(reason)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      flagReason === reason 
                        ? 'bg-red-600 text-white' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 h-24 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                placeholder="Enter reason for denying check-in..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmitFlag}
                disabled={!flagReason.trim()}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Ban className="w-5 h-5" />
                Deny Check-In
              </button>
              <button
                type="button"
                onClick={() => { setShowFlagModal(false); setFlaggingArrival(null); setFlagReason(''); }}
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
