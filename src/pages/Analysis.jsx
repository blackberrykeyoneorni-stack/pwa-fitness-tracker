import React, { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, Paper } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { db } from '../db';
import { useTheme } from '@mui/material/styles';

const Analysis = () => {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ max: 0, totalSessions: 0, avg: 0 });

  useEffect(() => {
    db.exercises.toArray().then(setExercises);
  }, []);

  useEffect(() => {
    if (!selectedExerciseId) return;

    const loadData = async () => {
      // 1. Logs der letzten 30 Tage holen
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoDateLimit = thirtyDaysAgo.toISOString().split('T')[0];

      const logs = await db.logs
        .where('date')
        .aboveOrEqual(isoDateLimit)
        .filter(log => log.exerciseId === selectedExerciseId)
        .toArray();

      // Sortieren nach Datum
      logs.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (logs.length === 0) {
        setChartData([]);
        setStats({ max: 0, totalSessions: 0, avg: 0 });
        return;
      }

      // 2. Daten für Nivo aufbereiten
      const exercise = exercises.find(e => e.id === selectedExerciseId);
      const isTime = exercise?.isTime;

      const dataPoints = logs.map(log => {
        // Fallback für alte Logs ohne gespeicherte Werte: 0
        const value = isTime ? (log.time || 0) : (log.weight || 0);
        return {
          x: new Date(log.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          y: value
        };
      });

      setChartData([
        {
          id: isTime ? 'Zeit' : 'Gewicht',
          color: theme.palette.primary.main,
          data: dataPoints
        }
      ]);

      // 3. Statistiken berechnen
      const values = dataPoints.map(p => p.y);
      const maxVal = Math.max(...values);
      const sumVal = values.reduce((a, b) => a + b, 0);
      
      setStats({
        max: maxVal,
        totalSessions: logs.length,
        avg: (sumVal / logs.length).toFixed(1)
      });
    };

    loadData();
  }, [selectedExerciseId, exercises, theme]);

  const getExerciseLabel = (id) => {
    const ex = exercises.find(e => e.id === id);
    if (!ex) return '';
    return ex.isTime ? 'Zeit (Sekunden)' : 'Gewicht (kg)';
  };

  return (
    <Box sx={{ p: 2, pb: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        Analyse
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 3, bgcolor: 'background.paper', boxShadow: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Übung wählen
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="" disabled>Bitte wählen...</MenuItem>
            {exercises.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedExerciseId && chartData.length > 0 ? (
        <Box sx={{ flexGrow: 1, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {/* Statistics Summary */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Paper sx={{ flex: 1, p: 2, borderRadius: 3, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stats.max}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Maximal</Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 2, borderRadius: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{stats.totalSessions}</Typography>
              <Typography variant="caption" color="text.secondary">Workouts</Typography>
            </Paper>
          </Box>

          {/* Nivo Chart */}
          <Paper sx={{ flexGrow: 1, p: 2, borderRadius: 3, bgcolor: 'background.paper', height: 350, boxShadow: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 'bold' }}>
              Entwicklung (30 Tage)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveLine
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: getExerciseLabel(selectedExerciseId),
                  legendOffset: -35,
                  legendPosition: 'middle'
                }}
                colors={[theme.palette.primary.main]}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                enableArea={true}
                areaOpacity={0.15}
                useMesh={true}
                enableGridX={false}
                theme={{
                  axis: {
                    ticks: { text: { fill: theme.palette.text.secondary } },
                    legend: { text: { fill: theme.palette.text.secondary } }
                  },
                  grid: { line: { stroke: theme.palette.divider } },
                  tooltip: {
                    container: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      fontSize: 12,
                      borderRadius: 8,
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Box>
      ) : (
        selectedExerciseId && (
          <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.6 }}>
            <Typography>Keine Daten für diesen Zeitraum vorhanden.</Typography>
          </Box>
        )
      )}
    </Box>
  );
};

export default Analysis;