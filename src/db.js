import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// Version 5: Logs erweitert um Leistungsdaten (weight, time, sets, reps) für Historien-Tracking
db.version(5).stores({
  exercises: '++id, name, days, targetSets, targetReps, targetWeight, restTime, isWeight, isTime, targetTime',
  logs: '++id, date, exerciseId, weight, time, reps, sets',
  dailyNotes: 'date, note',
  settings: 'id, value'
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];