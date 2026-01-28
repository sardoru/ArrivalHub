import { useState, useEffect, useCallback } from 'react';
import { Settings, Monitor, Tablet } from 'lucide-react';
import { supabase, type Arrival } from './lib/supabase';
import { AdminPanel } from './components/AdminPanel';
import { DisplayView } from './components/DisplayView';
import { GuestSignIn } from './components/GuestSignIn';

type View = 'admin' | 'display' | 'guest';

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function App() {
  const [view, setView] = useState<View>('admin');
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

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
        () => {
          fetchArrivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArrivals]);

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

    if (!matchingArrivals || matchingArrivals.length === 0) {
      return { 
        success: false, 
        message: `No reservation found for "${guestInfo.lastName}". Please see front desk for assistance.` 
      };
    }

    // Update the first matching arrival with guest info
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
  };

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
      <div className="bg-slate-900 text-white px-4 py-2 flex justify-center gap-2">
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
