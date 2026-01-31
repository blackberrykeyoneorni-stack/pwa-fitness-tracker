import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// HINWEIS: Bei Schema-Änderungen (wie dem Hinzufügen von 'days') wird die Version erhöht.
// Dexie führt das Upgrade automatisch durch.
db.version(3).stores({
  exercises: '++id, name, days, targetSets, targetReps, targetWeight, restTime',
  logs: '++id, date, exerciseId',
  dailyNotes: 'date, note',
  settings: 'id, value'
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];