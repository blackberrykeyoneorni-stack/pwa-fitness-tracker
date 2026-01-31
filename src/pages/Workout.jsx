import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, IconButton
} from '@mui/material';
import { Close as CloseIcon, SkipNext } from '@mui/icons-material';
import { db } from '../db';

const Workout = () => {
  const [exercises, setExercises] = useState([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState(new Set());
  const [dailyNote, setDailyNote] = useState('');

  // Modal State
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      // Load exercises
      const allExercises = await db.exercises.toArray();
      setExercises(allExercises);

      // Load completed exercises for today
      const logs = await db.logs.where('date').equals(today).toArray();
      const completedIds = new Set(logs.map(log => log.exerciseId));
      setCompletedExerciseIds(completedIds);

      // Load Daily Note
      const noteEntry = await db.dailyNotes.get(today);
      if (noteEntry) {
        setDailyNote(noteEntry.note);
      }
    };
    load();
  }, [today]);

  useEffect(() => {
    let timer;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && showTimer) {
      // Timer finished
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft]);

  const handleTimerComplete = () => {
    setShowTimer(false);
    if (selectedExercise) {
      if (currentSet < selectedExercise.sets) {
        setCurrentSet(prev => prev + 1);
      } else {
        // All sets done
        finishExercise(selectedExercise.id);
        handleCloseModal();
      }
    }
  };

  const finishExercise = async (id) => {
    await db.logs.add({ date: today, exerciseId: id });
    setCompletedExerciseIds(prev => new Set(prev).add(id));
  };

  const handleExerciseClick = (ex) => {
    setSelectedExercise(ex);
    setCurrentSet(1);
    setShowTimer(false);
    setTimeLeft(0);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setShowTimer(false);
  };

  const handleSaveNote = async () => {
    await db.dailyNotes.put({ date: today, note: dailyNote });
  };

  if (exercises.length === 0) return <Typography sx={{ p: 2 }}>Keine Übungen gefunden.</Typography>;

  return (
    <Box sx={{ p: 2, pb: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Training</Typography>

      {/* Exercise Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {exercises.map((ex) => (
          <Button
            key={ex.id}
            variant="contained"
            color={completedExerciseIds.has(ex.id) ? "success" : "primary"}
            size="large"
            onClick={() => handleExerciseClick(ex)}
            sx={{
              py: 3,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: 4,
              boxShadow: 3
            }}
          >
            {ex.name}
          </Button>
        ))}
      </Box>

      {/* Daily Note */}
      <TextField
        label="Notiz für heute"
        multiline
        rows={4}
        value={dailyNote}
        onChange={(e) => setDailyNote(e.target.value)}
        onBlur={handleSaveNote}
        variant="outlined"
        sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 1 }}
      />

      {/* Detail Modal */}
      <Dialog
        open={!!selectedExercise}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        {selectedExercise && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedExercise.name}
              <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Box sx={{
                    p: 4,
                    borderRadius: '50%',
                    textAlign: 'center',
                    width: 140,
                    height: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    border: '6px solid',
                    borderColor: showTimer ? 'secondary.main' : 'primary.main',
                    bgcolor: 'background.default'
                  }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {showTimer ? timeLeft : currentSet}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                      {showTimer ? 'PAUSE' : `SATZ / ${selectedExercise.sets}`}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" color="text.secondary">
                  Ziel: {selectedExercise.reps} Wiederholungen
                </Typography>

                {showTimer && (
                  <Box sx={{ mt: 3, width: '100%' }}>
                    <LinearProgress
                      variant="determinate"
                      value={(timeLeft / selectedExercise.restTime) * 100}
                      sx={{ height: 12, borderRadius: 6, mb: 1 }}
                    />
                    <Button fullWidth variant="outlined" startIcon={<SkipNext />} onClick={() => setTimeLeft(0)} sx={{ mt: 1 }}>
                      Pause überspringen
                    </Button>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              {!showTimer ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => { setTimeLeft(selectedExercise.restTime); setShowTimer(true); }}
                  sx={{ py: 2, borderRadius: 2, fontSize: '1.1rem' }}
                >
                  Satz {currentSet} OK
                </Button>
              ) : null}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Workout;