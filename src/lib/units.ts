// Exchange Building unit configuration
// Floor 2: 201-204 (2-story units, floor 3 is part of these)
// Floors 4-17: 13 units per floor (X01-X13)
// Floor 14: 1411+1412 joined (called 1411)
// Floor 18: 1806+1807 joined (called 1806)
// Floor 19: 1901 only

export type Unit = {
  number: string;
  floor: number;
  notes?: string;
};

export function generateUnits(): Unit[] {
  const units: Unit[] = [];

  // Floor 2: 201-204 (2-story units including floor 3)
  for (let i = 1; i <= 4; i++) {
    units.push({
      number: `20${i}`,
      floor: 2,
      notes: '2-story unit',
    });
  }

  // Floors 4-17
  for (let floor = 4; floor <= 17; floor++) {
    for (let unit = 1; unit <= 13; unit++) {
      const unitNumber = `${floor}${unit.toString().padStart(2, '0')}`;
      
      // Skip 1412 (joined with 1411)
      if (floor === 14 && unit === 12) continue;
      
      const notes = (floor === 14 && unit === 11) ? 'Combined with 1412' : undefined;
      
      units.push({
        number: unitNumber,
        floor,
        notes,
      });
    }
  }

  // Floor 18: 1801-1813 minus 1807 (joined with 1806)
  for (let unit = 1; unit <= 13; unit++) {
    if (unit === 7) continue; // 1807 joined with 1806
    
    const unitNumber = `18${unit.toString().padStart(2, '0')}`;
    const notes = unit === 6 ? 'Combined with 1807' : undefined;
    
    units.push({
      number: unitNumber,
      floor: 18,
      notes,
    });
  }

  // Floor 19: Just 1901
  units.push({
    number: '1901',
    floor: 19,
  });

  return units;
}

export const UNITS = generateUnits();

// Helper to get units by floor
export function getUnitsByFloor(): Map<number, Unit[]> {
  const byFloor = new Map<number, Unit[]>();
  
  for (const unit of UNITS) {
    const floorUnits = byFloor.get(unit.floor) || [];
    floorUnits.push(unit);
    byFloor.set(unit.floor, floorUnits);
  }
  
  return byFloor;
}

// Total unit count
export const TOTAL_UNITS = UNITS.length;
