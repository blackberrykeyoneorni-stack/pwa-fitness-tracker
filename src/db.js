import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// Version 6: Logs erweitert um RPE (Intensität) für Autoregulation
db.version(6).stores({
  exercises: '++id, name, days, targetSets, targetReps, targetWeight, restTime, isWeight, isTime, targetTime',
  logs: '++id, date, exerciseId, weight, time, reps, sets, rpe', // 'rpe' hinzugefügt
  dailyNotes: 'date, note',
  settings: 'id, value'
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];