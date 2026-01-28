import { useState } from 'react';
import { Building2, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { UNITS, getUnitsByFloor, type Unit } from '../lib/units';
import type { Arrival } from '../lib/supabase';

type Props = {
  arrivals: Arrival[];
};

type UnitWithGuest = Unit & {
  guest?: Arrival;
};

export function UnitsView({ arrivals }: Props) {
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant'>('all');

  // Map arrivals to units by unit_number
  const arrivalsByUnit = new Map<string, Arrival>();
  for (const arrival of arrivals) {
    if (arrival.unit_number && arrival.status !== 'no-show') {
      arrivalsByUnit.set(arrival.unit_number, arrival);
    }
  }

  // Attach guests to units
  const unitsWithGuests: UnitWithGuest[] = UNITS.map(unit => ({
    ...unit,
    guest: arrivalsByUnit.get(unit.number),
  }));

  // Group by floor
  const unitsByFloor = getUnitsByFloor();
  const floors = Array.from(unitsByFloor.keys()).sort((a, b) => b - a); // Descending

  const toggleFloor = (floor: number) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floor)) {
      newExpanded.delete(floor);
    } else {
      newExpanded.add(floor);
    }
    setExpandedFloors(newExpanded);
  };

  const expandAll = () => setExpandedFloors(new Set(floors));
  const collapseAll = () => setExpandedFloors(new Set());

  // Stats
  const occupiedCount = unitsWithGuests.filter(u => u.guest).length;
  const vacantCount = UNITS.length - occupiedCount;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-3xl font-bold text-slate-800">{UNITS.length}</div>
          <div className="text-sm text-slate-500">Total Units</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 shadow-sm border border-emerald-200">
          <div className="text-3xl font-bold text-emerald-700">{occupiedCount}</div>
          <div className="text-sm text-emerald-600">Occupied</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-3xl font-bold text-slate-600">{vacantCount}</div>
          <div className="text-sm text-slate-500">Vacant</div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'occupied'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Occupied
          </button>
          <button
            onClick={() => setFilter('vacant')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'vacant'
                ? 'bg-slate-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vacant
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-sm bg-white rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-sm bg-white rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Floors */}
      <div className="space-y-2">
        {floors.map(floor => {
          const floorUnits = unitsByFloor.get(floor) || [];
          const floorUnitsWithGuests = floorUnits.map(u => ({
            ...u,
            guest: arrivalsByUnit.get(u.number),
          }));
          
          // Apply filter
          const visibleUnits = floorUnitsWithGuests.filter(unit => {
            if (filter === 'occupied') return !!unit.guest;
            if (filter === 'vacant') return !unit.guest;
            return true;
          });

          if (visibleUnits.length === 0) return null;

          const floorOccupied = floorUnitsWithGuests.filter(u => u.guest).length;
          const isExpanded = expandedFloors.has(floor);

          return (
            <div key={floor} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleFloor(floor)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-800">Floor {floor}</span>
                  <span className="text-sm text-slate-500">
                    {floorOccupied}/{floorUnits.length} occupied
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-slate-100 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleUnits.map(unit => (
                      <UnitCard key={unit.number} unit={unit} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitCard({ unit }: { unit: UnitWithGuest }) {
  const hasGuest = !!unit.guest;
  
  return (
    <div
      className={`rounded-lg p-3 border ${
        hasGuest
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-bold text-lg text-slate-800">{unit.number}</span>
        {unit.notes && (
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
            {unit.notes}
          </span>
        )}
      </div>
      
      {hasGuest ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">
              {unit.guest!.first_name} {unit.guest!.last_name}
            </span>
          </div>
          {(unit.guest as Arrival & { checkout_date?: string }).checkout_date && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                Checkout: {new Date((unit.guest as Arrival & { checkout_date?: string }).checkout_date!).toLocaleDateString()}
              </span>
            </div>
          )}
          {unit.guest!.notes && unit.guest!.notes !== 'WALK-IN' && (
            <div className="text-xs text-slate-500 mt-1">{unit.guest!.notes}</div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-400">Vacant</div>
      )}
    </div>
  );
}
