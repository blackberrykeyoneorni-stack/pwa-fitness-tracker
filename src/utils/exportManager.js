import { db } from '../db';

export const exportData = async () => {
  try {
    const exercises = await db.exercises.toArray();
    const settings = await db.settings.toArray();
    const logs = await db.logs.toArray();
    const dailyNotes = await db.dailyNotes.toArray();

    const data = {
      exercises,
      settings,
      logs,
      dailyNotes,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calitracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Export fehlgeschlagen:', error);
    return false;
  }
};

export const exportCSV = async () => {
  try {
    const logs = await db.logs.orderBy('date').toArray();
    const exercises = await db.exercises.toArray();
    const exerciseMap = new Map(exercises.map(ex => [ex.id, ex.name]));

    const csvRows = [
      ['Datum', 'Übung']
    ];

    logs.forEach(log => {
      const exerciseName = exerciseMap.get(log.exerciseId) || 'Unbekannt';
      csvRows.push([log.date, exerciseName]);
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

    if (data.exercises) {
      await db.exercises.clear();
      await db.exercises.bulkAdd(data.exercises);
    }

    if (data.settings) {
      await db.settings.clear();
      await db.settings.bulkAdd(data.settings);
    }

    return true;
  } catch (error) {
    console.error('Import fehlgeschlagen:', error);
    return false;
  }
};