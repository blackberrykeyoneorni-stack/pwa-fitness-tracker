import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

db.version(1).stores({
  // exercises: id, Name, Wochentag, Zielwerte
  exercises: '++id, name, day, targetSets, targetReps, targetWeight',
  
  // logs: id, Datum, Referenz zur Übung
  logs: '++id, date, exerciseId' 
});

// Hilfsfunktion für Wochentage (Sortierung)
export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];
