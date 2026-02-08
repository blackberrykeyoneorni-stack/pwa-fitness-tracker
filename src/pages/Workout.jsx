import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, IconButton, Slider
} from '@mui/material';
import { Close as CloseIcon, SkipNext, FilterList, TrendingUp } from '@mui/icons-material';
import { db } from '../db';

const Workout = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState(new Set());
  const [dailyNote, setDailyNote] = useState('');
  const [showAll, setShowAll] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProgressionStep, setIsProgressionStep] = useState(false);
  const [progressionDelta, setProgressionDelta] = useState(0);

  const todayDate = new Date().toISOString().split('T')[0];
  const todayDay = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

  useEffect(() => {
    const load = async () => {
      const allExercises = await db.exercises.toArray();
      setExercises(allExercises);

      const logs = await db.logs.where('date').equals(todayDate).toArray();
      const completedIds = new Set(logs.map(log => log.exerciseId));
      setCompletedExerciseIds(completedIds);

      const noteEntry = await db.dailyNotes.get(todayDate);
      if (noteEntry) setDailyNote(noteEntry.note);
    };
    load();
  }, [todayDate]);

  useEffect(() => {
    if (showAll) {
      setFilteredExercises(exercises);
    } else {
      setFilteredExercises(exercises.filter(ex => ex.days && ex.days.includes(todayDay)));
    }
  }, [exercises, showAll, todayDay]);

  useEffect(() => {
    let timer;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && showTimer) {
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft]);

  const handleTimerComplete = () => {
    setShowTimer(false);
    if (currentSet < selectedExercise.sets) {
      setCurrentSet(prev => prev + 1);
    }
  };

  const handleNextStep = () => {
    if (currentSet < selectedExercise.sets) {
      setTimeLeft(selectedExercise.restTime);
      setShowTimer(true);
    } else {
      setIsProgressionStep(true);
    }
  };

  const handleFinishEarly = () => {
    setShowTimer(false);
    setIsProgressionStep(true);
  };

  const finishExercise = async () => {
    // 1. Logge die Leistung (Werte VOR der Progression, also das, was heute geleistet wurde)
    await db.logs.add({
      date: todayDate,
      exerciseId: selectedExercise.id,
      weight: selectedExercise.isWeight ? (selectedExercise.targetWeight || 0) : null,
      time: selectedExercise.isTime ? (selectedExercise.targetTime || 0) : null,
      reps: selectedExercise.reps || 0,
      sets: currentSet // Speichert wie viele Sätze tatsächlich gemacht wurden (relevant bei 'handleFinishEarly')
    });

    // 2. Berechne neues Ziel für das nächste Mal
    const newTarget = selectedExercise.isTime 
      ? (selectedExercise.targetTime || 0) + progressionDelta
      : (selectedExercise.targetWeight || 0) + progressionDelta;

    await db.exercises.update(selectedExercise.id, {
      [selectedExercise.isTime ? 'targetTime' : 'targetWeight']: newTarget
    });

    setCompletedExerciseIds(prev => new Set(prev).add(selectedExercise.id));

    handleCloseModal();
    const allExercises = await db.exercises.toArray();
    setExercises(allExercises);
  };

  const handleExerciseClick = (ex) => {
    setSelectedExercise(ex);
    setCurrentSet(1);
    setShowTimer(false);
    setIsProgressionStep(false);
    setProgressionDelta(0);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setShowTimer(false);
    setIsProgressionStep(false);
  };

  const handleSaveNote = async () => {
    await db.dailyNotes.put({ date: todayDate, note: dailyNote });
  };

  return (
    <Box sx={{ p: 2, pb: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ mb: 3, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{todayDay}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Button 
          variant="outlined" size="small" startIcon={<FilterList />} 
          onClick={() => setShowAll(!showAll)} sx={{ mt: 1, borderRadius: 2 }}
        >
          {showAll ? "Heute" : "Alle"}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredExercises.map((ex) => {
          const isCompleted = completedExerciseIds.has(ex.id);
          return (
            <Button
              key={ex.id}
              variant="contained"
              disabled={isCompleted}
              size="large"
              onClick={() => handleExerciseClick(ex)}
              sx={{
                py: 2.5, px: 3, borderRadius: 3, boxShadow: 3,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
                bgcolor: isCompleted ? 'action.disabledBackground' : 'primary.main',
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: 'text.disabled', boxShadow: 0 }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>{ex.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                {ex.sets} Sätze à {ex.isTime ? `${ex.targetTime}s` : `${ex.reps} Wdh.`}
                {ex.isWeight && ex.targetWeight ? ` • ${ex.targetWeight}kg` : ''}
              </Typography>
            </Button>
          );
        })}
      </Box>

      <TextField
        label="Notiz für heute"
        multiline rows={3}
        value={dailyNote}
        onChange={(e) => setDailyNote(e.target.value)}
        onBlur={handleSaveNote}
        variant="outlined"
        sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}
      />

      <Dialog open={!!selectedExercise} onClose={handleCloseModal} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        {selectedExercise && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{selectedExercise.name}</Typography>
              <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent>
              {!isProgressionStep ? (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <Box sx={{
                      p: 4, borderRadius: '50%', textAlign: 'center', width: 140, height: 140,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      border: '6px solid', borderColor: showTimer ? 'secondary.main' : 'primary.main', bgcolor: 'background.default'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{showTimer ? timeLeft : currentSet}</Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {showTimer ? 'PAUSE' : `SATZ / ${selectedExercise.sets}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    Ziel: {selectedExercise.isTime ? `${selectedExercise.targetTime}s` : `${selectedExercise.reps} Wdh.`}
                    {selectedExercise.isWeight && selectedExercise.targetWeight ? ` @ ${selectedExercise.targetWeight}kg` : ''}
                  </Typography>
                  {showTimer && (
                    <Box sx={{ mt: 3, width: '100%' }}>
                      <LinearProgress variant="determinate" value={(timeLeft / selectedExercise.restTime) * 100} sx={{ height: 12, borderRadius: 6, mb: 1 }} />
                      <Button fullWidth variant="outlined" startIcon={<SkipNext />} onClick={() => setTimeLeft(0)} sx={{ mt: 1 }}>Pause überspringen</Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <TrendingUp color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Progression wählen</Typography>
                  <Slider
                    value={progressionDelta}
                    min={selectedExercise.isTime ? -30 : -5}
                    max={selectedExercise.isTime ? 60 : 15}
                    step={selectedExercise.isTime ? 5 : 1}
                    onChange={(e, val) => setProgressionDelta(val)}
                    valueLabelDisplay="auto"
                    marks
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 4 }}>
                    <Typography variant="caption">Leichter</Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {progressionDelta > 0 ? `+${progressionDelta}` : progressionDelta} {selectedExercise.isTime ? 's' : 'kg'}
                    </Typography>
                    <Typography variant="caption">Schwerer</Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {!showTimer && !isProgressionStep && (
                <Button 
                  fullWidth variant="contained" size="large" 
                  onClick={handleNextStep} 
                  sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}
                >
                  {currentSet < selectedExercise.sets ? `Satz ${currentSet} abschließen` : "Übung beenden"}
                </Button>
              )}
              
              {!isProgressionStep && currentSet < selectedExercise.sets && (
                <Button 
                  fullWidth variant="text" size="small"
                  onClick={handleFinishEarly}
                  sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 'bold' }}
                >
                  Vorzeitig beenden
                </Button>
              )}

              {isProgressionStep && (
                <Button 
                  fullWidth variant="contained" size="large" 
                  onClick={finishExercise}
                  sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}
                >
                  Ergebnis speichern
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Workout;