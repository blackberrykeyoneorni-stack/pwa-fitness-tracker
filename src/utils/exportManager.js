import { db } from '../db';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const exportData = async (type) => {
  try {
    const allLogs = await db.logs.toArray();
    const allExercises = await db.exercises.toArray();

    // Mapping für lesbare CSV Namen
    const exerciseMap = {};
    allExercises.forEach(ex => exerciseMap[ex.id] = ex.name);

    if (type === 'json') {
      const data = {
        meta: { exportDate: new Date().toISOString(), version: 1 },
        exercises: allExercises,
        logs: allLogs
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `training_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
    } 
    
    else if (type === 'csv') {
      // CSV Header
      let csvContent = "Datum;Wochentag;Übung;SatzNr;Wdh;Gewicht;Kommentar\n";

      // Daten aufbereiten
      allLogs.forEach(log => {
        const exerciseName = exerciseMap[log.exerciseId] || 'Gelöschte Übung';
        const dateStr = format(new Date(log.date), 'yyyy-MM-dd HH:mm');
        const dayStr = format(new Date(log.date), 'EEEE'); // Wochentag Name

        if (log.sets && Array.isArray(log.sets)) {
          log.sets.forEach((set, index) => {
            const line = [
              dateStr,
              dayStr,
              `"${exerciseName}"`,
              index + 1,
              set.reps,
              set.weight,
              `"${log.comment || ''}"`
            ].join(';');
            csvContent += line + "\n";
          });
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `training_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
  } catch (error) {
    console.error("Export fehlgeschlagen:", error);
    alert("Export fehlgeschlagen: " + error.message);
  }
};
