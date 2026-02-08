import { db } from '../db';

const BACKUP_KEY = 'last_backup_timestamp';

// Hilfsfunktion: Datum des letzten Backups holen
export const getLastBackupDate = () => {
  return localStorage.getItem(BACKUP_KEY);
};

// Hilfsfunktion: Backup-Zeitpunkt speichern
const updateLastBackupDate = () => {
  const now = new Date().toISOString();
  localStorage.setItem(BACKUP_KEY, now);
  return now;
};

// Hauptfunktion: Smart Export
export const exportData = async () => {
  try {
    // 1. Alle Daten sammeln
    const exercises = await db.exercises.toArray();
    const settings = await db.settings.toArray();
    const logs = await db.logs.toArray();
    const dailyNotes = await db.dailyNotes.toArray();

    const data = {
      meta: {
        version: 1,
        appName: 'PWA Fitness Tracker',
        date: new Date().toISOString(),
      },
      exercises,
      settings,
      logs,
      dailyNotes
    };

    const fileName = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    // 2. Versuch: Moderne File System Access API (Desktop Chrome/Edge, Android Chrome teils)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Fitness Tracker Backup',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        updateLastBackupDate();
        return true;
      } catch (err) {
        // Abbruch durch User ist kein Fehler
        if (err.name === 'AbortError') return false;
        console.warn('File System API fehlgeschlagen, Fallback zu Download...', err);
        // Fallback wird unten ausgeführt
      }
    }

    // 3. Fallback: Klassischer Download (Blob)
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    updateLastBackupDate();
    return true;

  } catch (error) {
    console.error('Export fehlgeschlagen:', error);
    alert('Export fehlgeschlagen: ' + error.message);
    return false;
  }
};

export const exportCSV = async () => {
  try {
    const logs = await db.logs.orderBy('date').toArray();
    const exercises = await db.exercises.toArray();
    const dailyNotes = await db.dailyNotes.toArray();

    const exerciseMap = new Map(exercises.map(ex => [ex.id, ex.name]));
    const noteMap = new Map(dailyNotes.map(n => [n.date, n.note]));

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      ['Datum', 'Übung', 'Sätze', 'Wiederholungen', 'Zeit (s)', 'Gewicht (kg)', 'Kommentar'].map(escapeCsv)
    ];

    logs.forEach(log => {
      const exerciseName = exerciseMap.get(log.exerciseId) || 'Unbekannt';
      const note = noteMap.get(log.date) || '';
      
      csvRows.push([
        log.date,
        exerciseName,
        log.sets || '',
        log.reps || '',
        log.time || '',
        log.weight || '',
        note
      ].map(escapeCsv));
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + csvRows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `training_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('CSV Export fehlgeschlagen:', error);
    return false;
  }
};

export const importData = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validierung: Einfache Prüfung, ob es wie unser Format aussieht
    if (!data.exercises && !data.logs) {
      throw new Error("Ungültiges Dateiformat");
    }

    await db.transaction('rw', db.exercises, db.settings, db.logs, db.dailyNotes, async () => {
      if (data.exercises) {
        await db.exercises.clear();
        await db.exercises.bulkAdd(data.exercises);
      }
      if (data.settings) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }
      if (data.logs) {
        await db.logs.clear();
        await db.logs.bulkAdd(data.logs);
      }
      if (data.dailyNotes) {
        await db.dailyNotes.clear();
        await db.dailyNotes.bulkAdd(data.dailyNotes);
      }
    });

    // Setze Backup-Datum, da wir jetzt auf dem Stand dieses Backups sind
    if (data.meta && data.meta.date) {
        localStorage.setItem(BACKUP_KEY, data.meta.date);
    } else {
        updateLastBackupDate(); // "Jetzt" als Stand setzen
    }

    return true;
  } catch (error) {
    console.error('Import fehlgeschlagen:', error);
    alert('Import fehlgeschlagen: ' + error.message);
    return false;
  }
};