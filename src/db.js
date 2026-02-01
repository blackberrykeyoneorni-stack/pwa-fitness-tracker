import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// Version 4: Basis für progressive Übungsverwaltung
db.version(4).stores({
  exercises: '++id, name, days, targetSets, targetReps, targetWeight, restTime',
  logs: '++id, date, exerciseId',
  dailyNotes: 'date, note',
  settings: 'id, value'
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];