import { useState, useMemo } from 'react';
import { Clock, CheckCircle, Check, Sparkles, Building2, Wifi, UserCheck, AlertCircle, UserPlus } from 'lucide-react';
import type { Arrival } from '../lib/supabase';

type DisplayViewProps = {
  arrivals: Arrival[];
  currentTime: Date;
  onCheckIn: (id: string) => void;
};

export function DisplayView({ arrivals, currentTime, onCheckIn }: DisplayViewProps) {
  const [fontSize, setFontSize] = useState<'medium' | 'large' | 'xlarge'>('large');

  const pendingArrivals = arrivals.filter(a => a.status === 'pending' && !a.is_flagged);
  const checkedInCount = arrivals.filter(a => a.status === 'checked-in').length;
  const justArrivedCount = pendingArrivals.filter(a => a.signed_in_at && !a.id_verified).length;
  const walkInCount = pendingArrivals.filter(a => !a.unit_number && a.signed_in_at).length;

  // Sort: walk-ins needing unit first, then signed-in guests, then by last name
  const sortedPendingArrivals = useMemo(() => {
    return [...pendingArrivals].sort((a, b) => {
      // Priority 0: Walk-ins needing unit assignment at very top
      const aWalkIn = !a.unit_number && a.signed_in_at;
      const bWalkIn = !b.unit_number && b.signed_in_at;
      if (aWalkIn && !bWalkIn) return -1;
      if (!aWalkIn && bWalkIn) return 1;
      
      // Priority 1: Signed in but not ID verified (just arrived) - at top
      const aJustArrived = a.signed_in_at && !a.id_verified;
      const bJustArrived = b.signed_in_at && !b.id_verified;
      if (aJustArrived && !bJustArrived) return -1;
      if (!aJustArrived && bJustArrived) return 1;
      
      // Within just arrived, sort by most recent first
      if (aJustArrived && bJustArrived) {
        return new Date(b.signed_in_at!).getTime() - new Date(a.signed_in_at!).getTime();
      }
      
      // Then by last name
      return a.last_name.localeCompare(b.last_name);
    });
  }, [pendingArrivals]);

  const sizes = {
    medium: { name: 'text-xl', unit: 'text-lg', row: 'py-3' },
    large: { name: 'text-2xl', unit: 'text-xl', row: 'py-4' },
    xlarge: { name: 'text-3xl', unit: 'text-2xl', row: 'py-5' }
  };
  const size = sizes[fontSize];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <header className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl px-4 sm:px-8 py-4 sm:py-6 shadow-2xl border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/30">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Today's Arrivals</h1>
              <p className="text-slate-400 text-sm sm:text-base font-medium">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4">
            <div className="text-3xl sm:text-5xl font-mono font-bold tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-1">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Live Updates</span>
                <span className="sm:hidden">Live</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-slate-800/50 px-4 sm:px-8 py-3 sm:py-4 border-b border-white/5">
        <div className="flex flex-wrap justify-between items-center gap-3 sm:gap-4 max-w-7xl mx-auto">
          <div className="flex gap-4 sm:gap-8">
            {walkInCount > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 animate-pulse">
                <div className="p-1.5 sm:p-2 bg-purple-500/30 rounded-lg sm:rounded-xl border border-purple-500/50">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-purple-400">{walkInCount}</span>
                  <span className="text-purple-300 ml-1 sm:ml-2 text-sm sm:text-base font-medium">Walk-Ins</span>
                </div>
              </div>
            )}
            {justArrivedCount > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 animate-pulse">
                <div className="p-1.5 sm:p-2 bg-orange-500/30 rounded-lg sm:rounded-xl border border-orange-500/50">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-orange-400">{justArrivedCount}</span>
                  <span className="text-orange-300 ml-1 sm:ml-2 text-sm sm:text-base font-medium">Just Arrived</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-amber-400">{sortedPendingArrivals.length}</span>
                <span className="text-slate-400 ml-1 sm:ml-2 text-sm sm:text-base font-medium">Pending</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg sm:rounded-xl">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{checkedInCount}</span>
                <span className="text-slate-400 ml-1 sm:ml-2 text-sm sm:text-base font-medium">Checked In</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-700/50 rounded-lg sm:rounded-xl overflow-hidden p-1">
            {(['medium', 'large', 'xlarge'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold rounded-md sm:rounded-lg transition-all ${
                  fontSize === s
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {s === 'medium' ? 'A' : s === 'large' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {sortedPendingArrivals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 px-4">
              <div className="p-4 sm:p-6 bg-emerald-500/10 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
                <Sparkles className="w-12 h-12 sm:w-20 sm:h-20 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-white mb-2 text-center">All Guests Checked In!</div>
              <div className="text-base sm:text-xl text-slate-500 text-center">No pending arrivals at this time</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPendingArrivals.map((arrival, index) => {
                const isJustArrived = arrival.signed_in_at && !arrival.id_verified;
                const isWalkIn = !arrival.unit_number && arrival.signed_in_at;
                
                return (
                  <div
                    key={arrival.id}
                    className={`rounded-xl sm:rounded-2xl px-4 sm:px-6 ${size.row} transition-all group backdrop-blur-sm ${
                      isWalkIn
                        ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/20 border-2 border-purple-500 animate-pulse shadow-lg shadow-purple-500/20'
                        : isJustArrived
                        ? 'bg-gradient-to-r from-orange-600/30 to-orange-500/20 border-2 border-orange-500 animate-pulse shadow-lg shadow-orange-500/20'
                        : 'bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        <span className={`font-mono text-base sm:text-lg w-8 sm:w-10 font-medium flex-shrink-0 ${isWalkIn ? 'text-purple-400' : isJustArrived ? 'text-orange-400' : 'text-slate-500'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`${size.name} font-bold tracking-wide text-white truncate`}>
                          {arrival.last_name}, {arrival.first_name || '—'}
                        </span>
                        {isWalkIn && (
                          <span className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 animate-bounce">
                            <UserPlus className="w-4 h-4" />
                            WALK-IN
                          </span>
                        )}
                        {isJustArrived && !isWalkIn && (
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 animate-bounce">
                            <UserCheck className="w-4 h-4" />
                            JUST ARRIVED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
                        {arrival.notes && arrival.notes !== 'WALK-IN' && (
                          <span className="bg-slate-700/80 text-slate-300 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border border-slate-600/50 truncate max-w-[150px] sm:max-w-none">
                            {arrival.notes}
                          </span>
                        )}
                        {isWalkIn ? (
                          <span className={`bg-gradient-to-r from-purple-600 to-purple-700 ${size.unit} font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/20`}>
                            See Front Desk
                          </span>
                        ) : (
                          <span className={`bg-gradient-to-r from-blue-600 to-blue-700 ${size.unit} font-mono font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/20`}>
                            {arrival.unit_number}
                          </span>
                        )}
                        <button
                          onClick={() => onCheckIn(arrival.id)}
                          className={`bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 text-sm sm:text-base ${
                            isJustArrived ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100'
                          }`}
                        >
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">Check In</span>
                          <span className="sm:hidden">Check In</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-800/50 px-4 sm:px-8 py-3 sm:py-4 border-t border-white/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto text-slate-500 text-xs sm:text-sm">
          <span className="font-medium">Front Desk Display</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Real-time sync active</span>
            <span className="sm:hidden">Synced</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
