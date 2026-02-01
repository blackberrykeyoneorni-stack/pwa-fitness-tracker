import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// Version 4: Konsolidiertes Schema für alle Funktionen inkl. Progression
db.version(4).stores({
  exercises: '++id, name, days, targetSets, targetReps, targetWeight, restTime, isWeight, isTime, targetTime',
  logs: '++id, date, exerciseId',
  dailyNotes: 'date, note',
  settings: 'id, value'
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];