import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Monitor, Tablet, LogOut } from 'lucide-react';
import { supabase, type Arrival } from './lib/supabase';
import { AdminPanel } from './components/AdminPanel';
import { DisplayView } from './components/DisplayView';
import { GuestSignIn } from './components/GuestSignIn';
import { PasswordGate } from './components/PasswordGate';

type View = 'admin' | 'display' | 'guest';

// App timezone - configurable via env variable, defaults to Central Time
const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'America/Chicago';

function getLocalDateString(): string {
  // Use consistent timezone across all users
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  // Format: MM/DD/YYYY, then convert to YYYY-MM-DD
  const formatted = now.toLocaleDateString('en-US', options);
  const [month, day, year] = formatted.split('/');
  return `${year}-${month}-${day}`;
}

// Play a notification ping sound using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for the ping
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant ping sound - two tones
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1); // E6
    
    oscillator.type = 'sine';
    
    // Fade in and out for a smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log('Could not play notification sound:', e);
  }
}

function App() {
  // Check for kiosk mode (Guest Sign-In only, no password required)
  const isKioskMode = new URLSearchParams(window.location.search).get('kiosk') === 'true';
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('arrivalhub_authenticated') === 'true';
  });
  const [view, setView] = useState<View>('admin');
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Track signed-in arrivals to detect new sign-ins
  const previousSignedInIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const handleLogout = () => {
    localStorage.removeItem('arrivalhub_authenticated');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchArrivals = useCallback(async () => {
    const today = getLocalDateString();
    const { data, error } = await supabase
      .from('arrivals')
      .select('*')
      .eq('arrival_date', today)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching arrivals:', error);
      return;
    }

    setArrivals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArrivals();

    const channel = supabase
      .channel('arrivals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arrivals'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchArrivals();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArrivals]);

  // Poll for updates as backup (every 5 seconds)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchArrivals();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchArrivals]);

  // Detect new sign-ins and play notification sound (only on admin/display views)
  useEffect(() => {
    if (isKioskMode || view === 'guest') return;
    
    const currentSignedInIds = new Set(
      arrivals.filter(a => a.signed_in_at).map(a => a.id)
    );
    
    // Skip sound on initial page load
    if (isInitialLoadRef.current) {
      previousSignedInIdsRef.current = currentSignedInIds;
      if (arrivals.length > 0) {
        isInitialLoadRef.current = false;
      }
      return;
    }
    
    // Check if there are any new sign-ins
    let hasNewSignIn = false;
    currentSignedInIds.forEach(id => {
      if (!previousSignedInIdsRef.current.has(id)) {
        hasNewSignIn = true;
      }
    });
    
    // Play sound if new sign-in detected
    if (hasNewSignIn) {
      playNotificationSound();
    }
    
    // Update the ref with current signed-in IDs
    previousSignedInIdsRef.current = currentSignedInIds;
  }, [arrivals, isKioskMode, view]);

  const addArrival = async (arrival: Omit<Arrival, 'id' | 'created_at' | 'updated_at' | 'arrival_date'>) => {
    const today = getLocalDateString();
    const { error } = await supabase
      .from('arrivals')
      .insert([{ ...arrival, arrival_date: today }]);

    if (error) {
      console.error('Error adding arrival:', error);
      alert('Failed to add arrival. Please try again.');
      return;
    }
    await fetchArrivals();
  };

  const updateArrival = async (id: string, updates: Partial<Arrival>) => {
    const { error } = await supabase
      .from('arrivals')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating arrival:', error);
      alert('Failed to update arrival. Please try again.');
      return;
    }
    await fetchArrivals();
  };

  const removeArrival = async (id: string) => {
    const { error } = await supabase
      .from('arrivals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing arrival:', error);
      alert('Failed to remove arrival. Please try again.');
      return;
    }
    await fetchArrivals();
  };

  const clearAll = async () => {
    const today = getLocalDateString();
    const { error } = await supabase
      .from('arrivals')
      .delete()
      .eq('arrival_date', today);

    if (error) {
      console.error('Error clearing arrivals:', error);
      alert('Failed to clear arrivals. Please try again.');
      return;
    }
    await fetchArrivals();
  };

  const bulkImport = async (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newArrivals: Omit<Arrival, 'id' | 'created_at' | 'updated_at'>[] = [];
    const today = getLocalDateString();

    lines.forEach(line => {
      const match = line.match(/^([^,]+),\s*([^-]+)\s*-\s*(\d+)/);
      if (match) {
        newArrivals.push({
          last_name: match[1].trim().toUpperCase(),
          first_name: match[2].trim().toUpperCase(),
          unit_number: match[3].trim(),
          notes: '',
          status: 'pending',
          arrival_date: today
        });
      }
    });

    if (newArrivals.length > 0) {
      const { error } = await supabase
        .from('arrivals')
        .insert(newArrivals);

      if (error) {
        console.error('Error bulk importing:', error);
        alert('Failed to import arrivals. Please try again.');
        return;
      }
      await fetchArrivals();
    }
  };

  const loadSample = async () => {
    const today = getLocalDateString();
    const samples = [
      { last_name: 'ANDERSON', first_name: 'MICHAEL', unit_number: '1205', notes: 'VIP Guest', status: 'pending' as const, arrival_date: today },
      { last_name: 'CHEN', first_name: 'SARAH', unit_number: '2301', notes: '', status: 'pending' as const, arrival_date: today },
      { last_name: 'GARCIA', first_name: 'CARLOS', unit_number: '1847', notes: 'Late arrival 9pm', status: 'pending' as const, arrival_date: today },
      { last_name: 'JOHNSON', first_name: 'EMMA', unit_number: '3102', notes: '', status: 'pending' as const, arrival_date: today },
      { last_name: 'KIM', first_name: 'DAVID', unit_number: '2205', notes: 'Wheelchair accessible', status: 'pending' as const, arrival_date: today },
      { last_name: 'MARTINEZ', first_name: 'ANA', unit_number: '1504', notes: '', status: 'pending' as const, arrival_date: today },
      { last_name: 'PATEL', first_name: 'RAVI', unit_number: '2708', notes: 'Anniversary trip', status: 'pending' as const, arrival_date: today },
      { last_name: 'THOMPSON', first_name: 'JENNIFER', unit_number: '1923', notes: '', status: 'pending' as const, arrival_date: today },
    ];

    const { error } = await supabase
      .from('arrivals')
      .insert(samples);

    if (error) {
      console.error('Error loading sample data:', error);
      alert('Failed to load sample data. Please try again.');
      return;
    }
    await fetchArrivals();
  };

  const handleCheckIn = (id: string) => {
    updateArrival(id, { status: 'checked-in' });
  };

  const signInGuest = async (guestInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }): Promise<{ success: boolean; message: string }> => {
    const today = getLocalDateString();
    const normalizedLastName = guestInfo.lastName.trim().toUpperCase();
    const normalizedFirstName = guestInfo.firstName.trim().toUpperCase();
    
    // Find matching arrivals by last name (case-insensitive)
    const { data: matchingArrivals, error: fetchError } = await supabase
      .from('arrivals')
      .select('*')
      .eq('arrival_date', today)
      .ilike('last_name', normalizedLastName)
      .is('signed_in_at', null);

    if (fetchError) {
      console.error('Error finding arrival:', fetchError);
      return { success: false, message: 'Unable to process sign-in. Please see front desk.' };
    }

    // If matching arrival found, update it
    if (matchingArrivals && matchingArrivals.length > 0) {
      const arrivalToUpdate = matchingArrivals[0];
      const { error: updateError } = await supabase
        .from('arrivals')
        .update({
          guest_phone: guestInfo.phone,
          guest_email: guestInfo.email,
          signed_in_at: new Date().toISOString(),
          rules_accepted: true,
        })
        .eq('id', arrivalToUpdate.id);

      if (updateError) {
        console.error('Error updating arrival:', updateError);
        return { success: false, message: 'Unable to complete sign-in. Please see front desk.' };
      }

      await fetchArrivals();
      return { 
        success: true, 
        message: `Welcome, ${guestInfo.firstName}! Your unit is ${arrivalToUpdate.unit_number}.` 
      };
    }

    // No matching arrival - create a walk-in record
    const { error: insertError } = await supabase
      .from('arrivals')
      .insert([{
        last_name: normalizedLastName,
        first_name: normalizedFirstName,
        unit_number: '',  // No unit assigned yet
        notes: 'WALK-IN',
        status: 'pending',
        arrival_date: today,
        guest_phone: guestInfo.phone,
        guest_email: guestInfo.email,
        signed_in_at: new Date().toISOString(),
        rules_accepted: true,
      }]);

    if (insertError) {
      console.error('Error creating walk-in:', insertError);
      return { success: false, message: 'Unable to complete sign-in. Please see front desk.' };
    }

    await fetchArrivals();
    return { 
      success: true, 
      message: `Thank you, ${guestInfo.firstName}! Please see front desk for unit assignment.` 
    };
  };

  // Kiosk mode - Guest Sign-In only, no password required
  if (isKioskMode) {
    return <GuestSignIn onSignIn={signInGuest} />;
  }

  // Password gate - must be after all hooks
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading arrivals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-xl font-medium transition-all bg-slate-800 hover:bg-red-600 flex items-center gap-2 text-sm"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
        <div className="flex gap-2">
        <button
          onClick={() => setView('admin')}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            view === 'admin'
              ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          Admin Panel
        </button>
        <button
          onClick={() => setView('display')}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            view === 'display'
              ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <Monitor className="w-5 h-5" />
          Display View
        </button>
        <button
          onClick={() => setView('guest')}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            view === 'guest'
              ? 'bg-amber-600 shadow-lg shadow-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <Tablet className="w-5 h-5" />
          Guest Sign-In
        </button>
        </div>
        <div className="w-20 hidden sm:block"></div>
      </div>

      {view === 'admin' && (
        <AdminPanel
          arrivals={arrivals}
          onAdd={addArrival}
          onUpdate={updateArrival}
          onRemove={removeArrival}
          onClear={clearAll}
          onBulkImport={bulkImport}
          onLoadSample={loadSample}
        />
      )}
      {view === 'display' && (
        <DisplayView
          arrivals={arrivals}
          currentTime={currentTime}
          onCheckIn={handleCheckIn}
        />
      )}
      {view === 'guest' && (
        <GuestSignIn onSignIn={signInGuest} />
      )}
    </div>
  );
}

export default App;
