import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Box, Typography, FormControl, Select, MenuItem, Card, CardContent
} from '@mui/material';

export default function Analysis() {
  const allExercises = useLiveQuery(() => db.exercises.toArray());
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [chartData, setChartData] = useState([]);

  // Wenn Übungen geladen sind, wähle standardmäßig die erste
  useEffect(() => {
    if (allExercises && allExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(allExercises[0].id);
    }
  }, [allExercises]);

  // Daten für die Grafik aufbereiten
  useEffect(() => {
    const loadData = async () => {
      if (!selectedExerciseId) return;

      const logs = await db.logs
        .where('exerciseId')
        .equals(selectedExerciseId)
        .toArray();

      // Sortieren nach Datum
      logs.sort((a, b) => a.date - b.date);

      // Map Logs zu Chart-Daten (Wir nehmen hier das max. Gewicht des Trainings als Metrik)
      const data = logs.map(log => {
        // Finde das schwerste Gewicht des Tages
        const maxWeight = Math.max(...log.sets.map(s => Number(s.weight) || 0));
        // Alternativ: Volumen = sets * reps * weight
        const totalVolume = log.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);

        return {
          date: format(log.date, 'dd.MM'),
          weight: maxWeight,
          volume: totalVolume
        };
      });

      setChartData(data);
    };

    loadData();
  }, [selectedExerciseId]);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Analyse</Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <Select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          displayEmpty
        >
          {allExercises?.map((ex) => (
            <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {chartData.length > 0 ? (
        <Card sx={{ height: 400, borderRadius: 4, p: 1 }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" gutterBottom>Fortschritt (Max Gewicht)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#D0BCFF" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#D0BCFF' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          Noch keine Daten für diese Übung vorhanden.
        </Typography>
      )}
    </Box>
  );
}