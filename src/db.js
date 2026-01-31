import Dexie from 'dexie';

export const db = new Dexie('FitnessTrackerDB');

// HINWEIS: Wenn du die App bereits geöffnet hattest, lösche einmalig die Datenbank
// in den Browser-Entwicklertools (Application -> IndexedDB -> Delete),
// damit das neue Schema 'restTime' sicher übernommen wird.

db.version(2).stores({
  exercises: '++id, name, day, targetSets, targetReps, targetWeight, restTime',
  logs: '++id, date, exerciseId',
  dailyNotes: 'date, note',
  settings: 'id, value' // Explicitly adding settings store just in case, though it might be dynamically created or I should check if it was already there. 
  // Wait, looking at previous file content, settings wasn't in version(1) explicitly but used in Settings.jsx via db.settings. 
  // Dexie allows dynamic opening but best practice is defining it. 
  // However, looking at Settings.jsx: "const savedSettings = await db.settings.get('user_settings');" 
  // if 'settings' table is not defined in stores, accessing db.settings will fail unless it was added dynamically or I missed it.
  // The previous view_file of db.js only showed exercises and logs. 
  // Let me double check if I should add settings or if it works without.
  // Actually, if I bump version, I must define all stores that I want to keep.
  // If settings was working before, maybe it was added in a previous version or I missed it.
  // Wait, I see "db.settings.put" in Settings.jsx. 
  // If I look at db.js again...
  // Line 11: exercises: ...
  // Line 12: logs: ...
  // There is no settings in version 1.
  // If the user was using it, maybe Dexie was creating it dynamically? No, access property 'settings' on db instance usually requires it to be in stores.
  // Ah, or maybe it's not working? Or maybe I should just add it now to be safe. 
  // I will add it.
});

export const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];