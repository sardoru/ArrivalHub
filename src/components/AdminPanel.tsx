import React, { useState, useMemo } from 'react';
import { Plus, Upload, Trash2, Edit3, X, Package, Calendar, Users, CheckCircle, Clock, XCircle, Shield, Phone, Mail, AlertCircle, Flag, Ban, FileDown, Download, UserPlus, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, type Arrival } from '../lib/supabase';

type AdminPanelProps = {
  arrivals: Arrival[];
  onAdd: (arrival: Omit<Arrival, 'id' | 'created_at' | 'updated_at' | 'arrival_date'>) => void;
  onUpdate: (id: string, updates: Partial<Arrival>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBulkImport: (text: string) => void;
  onLoadSample: () => void;
  selectedDate: string;
  isToday: boolean;
  onNextDay: () => void;
  onPreviousDay: () => void;
  onGoToToday: () => void;
};

export function AdminPanel({
  arrivals,
  onAdd,
  onUpdate,
  onRemove,
  onClear,
  onBulkImport,
  onLoadSample,
  selectedDate,
  isToday,
  onNextDay,
  onPreviousDay,
  onGoToToday
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reportData, setReportData] = useState<Arrival[] | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [viewingSignature, setViewingSignature] = useState<string | null>(null);

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
  const walkInCount = arrivals.filter(a => !a.unit_number).length;

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

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    try {
      const { data, error } = await supabase
        .from('arrivals')
        .select('*')
        .gte('arrival_date', reportStartDate)
        .lte('arrival_date', reportEndDate)
        .order('arrival_date', { ascending: true })
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      setReportData(data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
      alert('Failed to load report data. Please try again.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const reportStats = useMemo(() => {
    if (!reportData) return null;
    return {
      total: reportData.length,
      checkedIn: reportData.filter(a => a.status === 'checked-in').length,
      noShow: reportData.filter(a => a.status === 'no-show').length,
      pending: reportData.filter(a => a.status === 'pending').length,
      denied: reportData.filter(a => a.is_flagged).length,
      selfSignedIn: reportData.filter(a => a.signed_in_at).length,
    };
  }, [reportData]);

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = [
      'Date',
      'Last Name',
      'First Name',
      'Unit',
      'Status',
      'Notes',
      'Guest Phone',
      'Guest Email',
      'Self Signed-In',
      'Signed-In Time',
      'ID Verified',
      'Flagged',
      'Flag Reason'
    ];

    const rows = reportData.map(a => [
      a.arrival_date,
      a.last_name,
      a.first_name || '',
      a.unit_number,
      a.is_flagged ? 'DENIED' : a.status.toUpperCase(),
      a.notes || '',
      a.guest_phone || '',
      a.guest_email || '',
      a.signed_in_at ? 'Yes' : 'No',
      a.signed_in_at ? new Date(a.signed_in_at).toLocaleString() : '',
      a.id_verified ? 'Yes' : 'No',
      a.is_flagged ? 'Yes' : 'No',
      a.flag_reason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Add summary at the end
    const summaryLines = [
      '',
      '',
      'SUMMARY REPORT',
      `Date Range,${reportStartDate} to ${reportEndDate}`,
      `Total Scheduled,${reportStats?.total || 0}`,
      `Checked In,${reportStats?.checkedIn || 0}`,
      `No Shows,${reportStats?.noShow || 0}`,
      `Pending,${reportStats?.pending || 0}`,
      `Denied Access,${reportStats?.denied || 0}`,
      `Self Signed-In (Kiosk),${reportStats?.selfSignedIn || 0}`
    ];

    const fullCSV = csvContent + '\n' + summaryLines.join('\n');

    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `arrivals-report-${reportStartDate}-to-${reportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportData(null);
  };

  // Sort arrivals: flagged at top, then walk-ins needing unit, then signed-in awaiting ID, then by last name
  const sortedArrivals = useMemo(() => {
    return [...arrivals].sort((a, b) => {
      // Priority 0: Flagged guests at very top
      if (a.is_flagged && !b.is_flagged) return -1;
      if (!a.is_flagged && b.is_flagged) return 1;

      // Priority 0.5: Walk-ins needing unit assignment (no unit_number)
      const aWalkIn = !a.unit_number && a.signed_in_at && a.status === 'pending' && !a.is_flagged;
      const bWalkIn = !b.unit_number && b.signed_in_at && b.status === 'pending' && !b.is_flagged;
      if (aWalkIn && !bWalkIn) return -1;
      if (!aWalkIn && bWalkIn) return 1;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg sm:rounded-xl">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Arrivals Management</h1>
              <p className="text-slate-300 text-xs sm:text-sm">Front Desk Administration Panel</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
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
            {walkInCount > 0 && (
              <div className="bg-purple-50 border-2 border-purple-400 px-3 sm:px-5 py-3 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span className="text-xl sm:text-2xl font-bold text-purple-700">{walkInCount}</span>
                </div>
                <div className="text-xs text-purple-600 font-medium mt-1">Walk-Ins</div>
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

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
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
                <div className="space-y-3 sm:space-y-5">
                  {/* Mobile: side by side, Desktop: stacked */}
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="SMITH"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="JOHN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                        Unit # <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="1234"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="VIP, late arrival, etc."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 text-sm sm:text-base"
                    >
                      {editingId ? (
                        <>
                          <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          Add
                        </>
                      )}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 sm:px-4 bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-300 transition-all"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <hr className="my-4 sm:my-6 border-slate-200" />

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-3 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="bg-slate-100 text-slate-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Bulk Import
                </button>
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="bg-emerald-50 text-emerald-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base"
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sample Data
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-red-50 text-red-600 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 text-xs sm:text-base"
                >
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                    {isToday ? "Today's" : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} Arrivals ({arrivals.length})
                  </h2>
                  
                  {/* Date Navigation */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={onPreviousDay}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors"
                      title="Previous day"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                    </button>
                    
                    {!isToday && (
                      <button
                        type="button"
                        onClick={onGoToToday}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs sm:text-sm font-medium transition-colors"
                      >
                        Today
                      </button>
                    )}
                    
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 rounded-lg min-w-[90px] sm:min-w-[100px] text-center">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    
                    <button
                      type="button"
                      onClick={onNextDay}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors"
                      title="Next day"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {arrivals.length === 0 ? (
                <div className="p-8 sm:p-16 text-center text-slate-400">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-base sm:text-lg font-medium">No arrivals yet</p>
                  <p className="text-xs sm:text-sm mt-2">Add arrivals using the form or tap "Sample Data"</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                  {sortedArrivals.map((arrival) => {
                    const isAwaitingId = arrival.signed_in_at && !arrival.id_verified && arrival.status === 'pending' && !arrival.is_flagged;
                    const isIdVerified = arrival.signed_in_at && arrival.id_verified && arrival.status === 'pending' && !arrival.is_flagged;
                    const isFlagged = arrival.is_flagged;
                    const isWalkIn = !arrival.unit_number && arrival.signed_in_at;
                    
                    return (
                      <div
                        key={arrival.id}
                        className={`px-3 sm:px-6 py-3 sm:py-4 transition-all ${
                          isFlagged
                            ? 'bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-600'
                            : isWalkIn && arrival.status === 'pending'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-50 border-l-4 border-purple-500 animate-pulse'
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Name and Unit Row */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1 sm:mb-2">
                              <span className="text-base sm:text-lg font-bold text-slate-800">
                                {arrival.last_name}, {arrival.first_name || '—'}
                              </span>
                              {isWalkIn ? (
                                <span className="bg-purple-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1">
                                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  WALK-IN
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-base sm:text-lg font-mono font-bold">
                                  {arrival.unit_number}
                                </span>
                              )}
                            </div>
                            
                            {/* Walk-in unit assignment */}
                            {isWalkIn && (
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  placeholder="Assign Unit #"
                                  className="w-28 sm:w-24 px-2 sm:px-3 py-1 text-base sm:text-lg font-mono font-bold border-2 border-purple-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const input = e.target as HTMLInputElement;
                                      if (input.value.trim()) {
                                        onUpdate(arrival.id, { unit_number: input.value.trim() });
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value.trim()) {
                                      onUpdate(arrival.id, { unit_number: e.target.value.trim() });
                                    }
                                  }}
                                />
                                <span className="text-xs text-purple-600 font-medium hidden sm:inline">Enter to assign</span>
                              </div>
                            )}
                            
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-1 sm:mb-2">
                              {isFlagged && (
                                <span className="bg-red-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1">
                                  <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">DENIED - CHECK-IN BLOCKED</span>
                                  <span className="sm:hidden">DENIED</span>
                                </span>
                              )}
                              {isAwaitingId && (
                                <span className="bg-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 animate-bounce">
                                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                  VERIFY ID
                                </span>
                              )}
                              {isIdVerified && (
                                <span className="bg-blue-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  ID VERIFIED
                                </span>
                              )}
                              {arrival.notes && arrival.notes !== 'WALK-IN' && (
                                <span className="bg-slate-100 text-slate-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium">
                                  {arrival.notes}
                                </span>
                              )}
                            </div>
                            
                            {/* Flag reason for flagged guests */}
                            {isFlagged && arrival.flag_reason && (
                              <div className="bg-red-200/50 border border-red-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 mt-1 sm:mt-2 mb-1 sm:mb-2">
                                <p className="text-red-800 text-xs sm:text-sm font-medium flex items-start gap-1 sm:gap-2">
                                  <Flag className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                                  <span><strong>Reason:</strong> {arrival.flag_reason}</span>
                                </p>
                              </div>
                            )}
                            
                            {/* Guest contact info for signed-in guests */}
                            {arrival.signed_in_at && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-1">
                                {arrival.guest_phone && (
                                  <a 
                                    href={`tel:${arrival.guest_phone}`}
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                  >
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                    <span className="hidden sm:inline">{arrival.guest_phone}</span>
                                    <span className="sm:hidden">Call</span>
                                  </a>
                                )}
                                {arrival.guest_email && (
                                  <a 
                                    href={`mailto:${arrival.guest_email}`}
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                  >
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                    <span className="hidden sm:inline">{arrival.guest_email}</span>
                                    <span className="sm:hidden">Email</span>
                                  </a>
                                )}
                                {arrival.signature && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingSignature(arrival.signature)}
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                  >
                                    <PenTool className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                    <span>Signature</span>
                                  </button>
                                )}
                                <span className="text-slate-400 text-xs">
                                  {new Date(arrival.signed_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons - stack on mobile */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 mt-2 sm:mt-0">
                            {/* Flagged guest actions */}
                            {isFlagged && (
                              <button
                                type="button"
                                onClick={() => handleClearFlag(arrival.id)}
                                className="bg-slate-200 text-slate-700 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-slate-300 transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                Clear
                              </button>
                            )}
                            
                            {/* ID Verification button for signed-in guests (not flagged) */}
                            {isAwaitingId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdate(arrival.id, { id_verified: true })}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-1 sm:gap-2 shadow-lg shadow-orange-500/25 text-xs sm:text-sm"
                                >
                                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFlagModal(arrival)}
                                  className="bg-red-100 text-red-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-1 text-xs sm:text-sm"
                                >
                                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="hidden sm:inline">Flag</span>
                                </button>
                              </>
                            )}
                            
                            {/* Check-in button - only after ID verified (not flagged) */}
                            {isIdVerified && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdate(arrival.id, { status: 'checked-in' })}
                                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-1 sm:gap-2 shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="hidden sm:inline">Check In & Give Keys</span>
                                  <span className="sm:hidden">Check In</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFlagModal(arrival)}
                                  className="bg-red-100 text-red-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-1 text-xs sm:text-sm"
                                >
                                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              </>
                            )}
                            
                            {/* Status select for non-signed-in guests (not flagged) */}
                            {!arrival.signed_in_at && !isFlagged && (
                              <>
                                <select
                                  value={arrival.status}
                                  onChange={(e) => onUpdate(arrival.id, { status: e.target.value as Arrival['status'] })}
                                  className={`rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border-2 cursor-pointer transition-all ${
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
                                    className="p-1.5 sm:p-2.5 text-red-500 hover:bg-red-100 rounded-lg sm:rounded-xl transition-all"
                                    title="Flag Issue"
                                  >
                                    <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Show status badge for checked-in guests who went through sign-in */}
                            {arrival.signed_in_at && arrival.status === 'checked-in' && !isFlagged && (
                              <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Checked In</span>
                                <span className="sm:hidden">Done</span>
                              </span>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleEdit(arrival)}
                              className="p-1.5 sm:p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg sm:rounded-xl transition-all"
                            >
                              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemove(arrival.id)}
                              className="p-1.5 sm:p-2.5 text-red-500 hover:bg-red-100 rounded-lg sm:rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
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

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileDown className="w-6 h-6 text-indigo-600" />
              Export Activity Report
            </h3>
            
            {/* Date Range Selection */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 font-medium mb-3">Select Date Range</p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <span className="text-slate-400 hidden sm:block">to</span>
                <div className="flex-1 w-full">
                  <label className="block text-xs text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isLoadingReport}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 mt-4 sm:mt-5 w-full sm:w-auto"
                >
                  {isLoadingReport ? 'Loading...' : 'Generate'}
                </button>
              </div>
              
              {/* Quick date presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setReportStartDate(today);
                    setReportEndDate(today);
                  }}
                  className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    setReportStartDate(yesterday.toISOString().split('T')[0]);
                    setReportEndDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setReportStartDate(weekAgo.toISOString().split('T')[0]);
                    setReportEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    setReportStartDate(monthAgo.toISOString().split('T')[0]);
                    setReportEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Report Results */}
            {reportData && (
              <>
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Report Summary: {reportStartDate === reportEndDate 
                      ? new Date(reportStartDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                      : `${new Date(reportStartDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(reportEndDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    }
                  </h4>
                  
                  {reportStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-slate-700">{reportStats.total}</div>
                        <div className="text-xs text-slate-500 font-medium">Scheduled</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-700">{reportStats.checkedIn}</div>
                        <div className="text-xs text-emerald-600 font-medium">Checked In</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{reportStats.noShow}</div>
                        <div className="text-xs text-red-500 font-medium">No Shows</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-amber-700">{reportStats.pending}</div>
                        <div className="text-xs text-amber-600 font-medium">Pending</div>
                      </div>
                      <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{reportStats.denied}</div>
                        <div className="text-xs text-red-600 font-medium">Denied Access</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{reportStats.selfSignedIn}</div>
                        <div className="text-xs text-blue-600 font-medium">Self Sign-Ins</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed List Preview */}
                {reportData.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Preview ({reportData.length} records)</h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 text-slate-600 font-semibold">Date</th>
                            <th className="text-left px-3 py-2 text-slate-600 font-semibold">Name</th>
                            <th className="text-left px-3 py-2 text-slate-600 font-semibold">Unit</th>
                            <th className="text-left px-3 py-2 text-slate-600 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {reportData.slice(0, 20).map((arrival) => (
                            <tr key={arrival.id} className="hover:bg-white">
                              <td className="px-3 py-2 text-slate-600">{arrival.arrival_date}</td>
                              <td className="px-3 py-2 text-slate-800 font-medium">
                                {arrival.last_name}, {arrival.first_name || '—'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 font-mono">{arrival.unit_number}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  arrival.is_flagged 
                                    ? 'bg-red-100 text-red-700'
                                    : arrival.status === 'checked-in' 
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : arrival.status === 'no-show'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {arrival.is_flagged ? 'DENIED' : arrival.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length > 20 && (
                        <div className="text-center py-2 text-sm text-slate-500 bg-slate-100">
                          ... and {reportData.length - 20} more records
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {reportData.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No arrivals found for this date range</p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-4">
              {reportData && reportData.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download CSV
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseReportModal}
                className={`${reportData && reportData.length > 0 ? 'px-6' : 'flex-1'} bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-all`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Viewing Modal */}
      {viewingSignature && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PenTool className="w-6 h-6 text-slate-600" />
              Guest Signature
            </h3>
            <div className="bg-slate-100 rounded-xl p-4 mb-4">
              <img 
                src={viewingSignature} 
                alt="Guest signature" 
                className="w-full h-auto rounded-lg"
                style={{ backgroundColor: 'rgb(30, 41, 59)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setViewingSignature(null)}
              className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
