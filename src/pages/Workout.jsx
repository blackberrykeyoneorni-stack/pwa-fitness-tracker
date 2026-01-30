import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WEEKDAYS } from '../db';
import { format } from 'date-fns';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Dialog, AppBar, Toolbar, IconButton, Slide, Checkbox,
  LinearProgress, Chip, Drawer
} from '@mui/material';
import { Close, History, Timer as TimerIcon, CheckCircle } from '@mui/icons-material';

// Transition für den Vollbild-Dialog (Logger)
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Workout() {
  // 1. Tag ermitteln
  const todayIndex = (new Date().getDay() + 6) % 7; // Montag = 0
  const todayName = WEEKDAYS[todayIndex];

  // 2. Übungen laden
  const exercises = useLiveQuery(() => db.exercises.where('day').equals(todayName).toArray());
  
  // 3. State für aktives Training
  const [activeExercise, setActiveExercise] = useState(null); // Welches Ex wird gerade trainiert?
  const [sets, setSets] = useState([]); // Aktuelle Eingabewerte
  const [historyLog, setHistoryLog] = useState(null); // Letztes Training (Ghost Values)

  // 4. Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(0);

  // Timer Logik
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Öffnet den Logger für eine Übung
  const openLogger = async (exercise) => {
    setActiveExercise(exercise);
    
    // Letzten Log holen (für Ghost Values)
    const lastLog = await db.logs
      .where('exerciseId').equals(exercise.id)
      .reverse()
      .first();
    setHistoryLog(lastLog);

    // Initialisiere leere Sets basierend auf Zielvorgabe
    const initialSets = Array.from({ length: exercise.targetSets }).map(() => ({
      reps: exercise.targetReps, // Vorbelegung mit Zielwert (optional, kann auch leer sein)
      weight: exercise.targetWeight,
      done: false
    }));
    setSets(initialSets);
  };

  const closeLogger = () => {
    setActiveExercise(null);
    setSets([]);
  };

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const toggleSetDone = (index) => {
    const newSets = [...sets];
    newSets[index].done = !newSets[index].done;
    setSets(newSets);

    // Timer starten, wenn Satz als "Done" markiert wird UND es nicht der letzte Satz ist
    if (newSets[index].done && index < sets.length - 1) {
      startTimer(activeExercise.restTime || 60);
    }
  };

  const startTimer = (seconds) => {
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setTimerActive(true);
  };

  const saveWorkout = async () => {
    // Nur fertige Sätze speichern
    const completedSets = sets.filter(s => s.done).map(s => ({
      reps: Number(s.reps),
      weight: Number(s.weight)
    }));

    if (completedSets.length === 0) {
        closeLogger();
        return;
    }

    await db.logs.add({
      date: new Date(),
      exerciseId: activeExercise.id,
      sets: completedSets,
      comment: ''
    });

    closeLogger();
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 3, pb: 1 }}>
        <Typography variant="h4" fontWeight="bold">Training</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {todayName} • {exercises?.length || 0} Übungen
        </Typography>
      </Box>

      {/* Übungsliste */}
      <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {exercises?.map((ex) => (
          <Card 
            key={ex.id} 
            onClick={() => openLogger(ex)}
            sx={{ 
              borderRadius: 4, 
              cursor: 'pointer',
              bgcolor: 'background.paper',
              border: '1px solid rgba(255,255,255,0.05)',
              '&:active': { transform: 'scale(0.98)' },
              transition: 'transform 0.1s'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="600">{ex.name}</Typography>
                <Typography variant="body2" color="primary.main">
                  Ziel: {ex.targetSets} x {ex.targetReps}
                </Typography>
              </Box>
              <Button variant="outlined" sx={{ borderRadius: 4 }}>Start</Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Logger Dialog (Vollbild) */}
      <Dialog 
        fullScreen 
        open={!!activeExercise} 
        onClose={closeLogger} 
        TransitionComponent={Transition}
        PaperProps={{ sx: { bgcolor: '#000' } }} // Tiefschwarz für Focus
      >
        {activeExercise && (
          <>
            <AppBar sx={{ position: 'relative', bgcolor: 'transparent', boxShadow: 'none' }}>
              <Toolbar>
                <IconButton edge="start" color="inherit" onClick={closeLogger}>
                  <Close />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
                  {activeExercise.name}
                </Typography>
                <Button autoFocus color="inherit" onClick={saveWorkout}>
                  Fertig
                </Button>
              </Toolbar>
            </AppBar>

            <Box sx={{ p: 2 }}>
              {/* History Card (Ghost Values) */}
              {historyLog && (
                <Card sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <History fontSize="small" />
                      <Typography variant="body2">Letztes Mal ({format(historyLog.date, 'dd.MM.')}):</Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {historyLog.sets.map((s, i) => (
                            <Chip key={i} label={`${s.reps}x ${s.weight}kg`} size="small" variant="outlined" />
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Input Rows */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 1fr 0.5fr', gap: 2, px: 1 }}>
                    <Typography variant="caption" color="text.secondary" align="center">SATZ</Typography>
                    <Typography variant="caption" color="text.secondary" align="center">KG</Typography>
                    <Typography variant="caption" color="text.secondary" align="center">WDH</Typography>
                    <Typography variant="caption" color="text.secondary" align="center">OK</Typography>
                </Box>

                {sets.map((set, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '0.5fr 1fr 1fr 0.5fr', 
                        gap: 2, 
                        alignItems: 'center',
                        bgcolor: set.done ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                        borderRadius: 2,
                        p: 1
                    }}
                  >
                    <Typography variant="h6" align="center" color={set.done ? 'primary' : 'text.primary'}>
                        {index + 1}
                    </Typography>
                    
                    <TextField 
                        type="number" 
                        variant="outlined" 
                        size="small"
                        value={set.weight}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        disabled={set.done}
                        sx={{ input: { textAlign: 'center' } }}
                    />
                    
                    <TextField 
                        type="number" 
                        variant="outlined" 
                        size="small"
                        value={set.reps}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                        disabled={set.done}
                        sx={{ input: { textAlign: 'center', fontWeight: 'bold' } }}
                    />

                    <IconButton 
                        color={set.done ? "primary" : "default"} 
                        onClick={() => toggleSetDone(index)}
                        size="large"
                    >
                        <CheckCircle />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              
              <Button 
                variant="text" 
                startIcon={<AddIcon />} 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => setSets([...sets, { reps: '', weight: 0, done: false }])}
              >
                Satz hinzufügen
              </Button>

            </Box>
          </>
        )}
      </Dialog>

      {/* Globaler Timer (unten eingeblendet) */}
      <Drawer
        anchor="bottom"
        open={timerActive}
        variant="persistent"
        PaperProps={{
            sx: { 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                p: 2
            }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimerIcon />
                <Typography variant="h5" fontWeight="bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Pause</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" color="secondary" onClick={() => setTimeLeft(timeLeft + 10)}>+10s</Button>
                <Button size="small" variant="text" color="inherit" onClick={() => setTimerActive(false)}>Stop</Button>
            </Box>
        </Box>
        <LinearProgress 
            variant="determinate" 
            value={(timeLeft / initialTime) * 100} 
            sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} 
        />
      </Drawer>
    </Box>
  );
}

// Hilfs-Icon Import
import { Add as AddIcon } from '@mui/icons-material';