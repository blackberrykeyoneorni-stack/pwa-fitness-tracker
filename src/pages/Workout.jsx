import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  CheckCircle,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';

const Workout = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      const allExercises = await db.exercises.toArray();
      if (allExercises.length > 0) {
        setExercises(allExercises);
      }
    };
    loadWorkout();
  }, []);

  useEffect(() => {
    let timer;
    if (showTimer && timeLeft > 0 && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && showTimer) {
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft, isPaused]);

  const handleSetComplete = () => {
    const currentExercise = exercises[currentIndex];
    setTimeLeft(currentExercise.restTime || 60);
    setShowTimer(true);
  };

  const handleTimerComplete = () => {
    setShowTimer(false);
    const currentExercise = exercises[currentIndex];
    
    if (currentSet < currentExercise.sets) {
      setCurrentSet(prev => prev + 1);
    } else {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentSet(1);
      } else {
        setWorkoutComplete(true);
      }
    }
  };

  const skipTimer = () => {
    setTimeLeft(0);
  };

  if (exercises.length === 0) return <Typography sx={{ p: 2 }}>Lade Training...</Typography>;
  if (workoutComplete) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>Training beendet!</Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Zum Dashboard</Button>
      </Box>
    );
  }

  const currentExercise = exercises[currentIndex];

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Übung {currentIndex + 1} von {exercises.length}
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {currentExercise.name}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {currentExercise.reps} Wiederholungen
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '8px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{currentSet}</Typography>
          <Typography variant="subtitle1">von {currentExercise.sets}</Typography>
        </Paper>
      </Box>

      {!showTimer ? (
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSetComplete}
          sx={{ py: 2, borderRadius: 4, fontSize: '1.2rem' }}
        >
          Satz {currentSet} OK
        </Button>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <TimerIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h3" sx={{ mb: 2 }}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(timeLeft / (currentExercise.restTime || 60)) * 100} 
            sx={{ mb: 3, height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton onClick={() => setIsPaused(!isPaused)} sx={{ color: 'white', border: '2px solid white' }}>
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
            <IconButton onClick={skipTimer} sx={{ color: 'white', border: '2px solid white' }}>
              <SkipNext />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Dialog open={showTimer} onClose={() => {}} fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>Pause</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
             {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Typography>
          <Typography variant="body1">
            {currentSet < currentExercise.sets ? `Nächster Satz: ${currentSet + 1}` : 'Nächste Übung folgt'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={skipTimer} variant="outlined" color="primary">
            Pause überspringen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Workout;