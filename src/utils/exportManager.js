import { db } from '../db';

export const exportData = async () => {
  try {
    const exercises = await db.exercises.toArray();
    const settings = await db.settings.toArray();
    
    const data = {
      exercises,
      settings,
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