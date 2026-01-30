import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// HINWEIS: Wenn du die App bereits geöffnet hattest, lösche einmalig die Datenbank
// in den Browser-Entwicklertools (Application -> IndexedDB -> Delete),
// damit das neue Schema 'restTime' sicher übernommen wird.

db.version(1).stores({
  // NEU: 'restTime' hinzugefügt
  exercises: '++id, name, day, targetSets, targetReps, targetWeight, restTime', 
  logs: '++id, date, exerciseId' 
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];