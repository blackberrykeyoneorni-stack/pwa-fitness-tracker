import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Timer as TimerIcon, SkipNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';

const Workout = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const load = async () => {
      const all = await db.exercises.toArray();
      setExercises(all);
    };
    load();
  }, []);

  useEffect(() => {
    let timer;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && showTimer) {
      setShowTimer(false);
      if (currentSet < exercises[currentIndex].sets) {
        setCurrentSet(prev => prev + 1);
      } else {
        if (currentIndex < exercises.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentSet(1);
        } else {
          navigate('/'); // Training Ende
        }
      }
    }
    return () => clearInterval(timer);
  }, [showTimer, timeLeft, currentIndex, currentSet, exercises, navigate]);

  if (exercises.length === 0) return <Typography sx={{ p: 2 }}>Keine Übungen gefunden.</Typography>;

  const currentEx = exercises[currentIndex];

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      {/* Fortschrittsliste */}
      <Paper sx={{ p: 1, mb: 2, borderRadius: 2, bgcolor: 'background.default' }} variant="outlined">
        <List dense sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', p: 0 }}>
          {exercises.map((ex, idx) => (
            <ListItem key={ex.id} sx={{ minWidth: 'fit-content', px: 1 }}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                {idx < currentIndex ? <CheckCircle color="success" fontSize="small" /> : 
                 idx === currentIndex ? <RadioButtonUnchecked color="primary" fontSize="small" /> : 
                 <RadioButtonUnchecked color="disabled" fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={ex.name} 
                primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: idx === currentIndex ? 'bold' : 'normal' }} 
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        {currentEx.name}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: '50%', textAlign: 'center', width: 120, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '4px solid', borderColor: showTimer ? 'secondary.main' : 'primary.main' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{showTimer ? timeLeft : currentSet}</Typography>
          <Typography variant="caption">{showTimer ? 'PAUSE' : `SATZ / ${currentEx.sets}`}</Typography>
        </Paper>
      </Box>

      <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
        Ziel: {currentEx.reps} Wiederholungen
      </Typography>

      {!showTimer ? (
        <Button 
          fullWidth variant="contained" size="large" 
          onClick={() => { setTimeLeft(currentEx.restTime); setShowTimer(true); }}
          sx={{ py: 2, mt: 2, borderRadius: 3 }}
        >
          Satz {currentSet} OK - Pause starten
        </Button>
      ) : (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={(timeLeft / currentEx.restTime) * 100} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
          <Button fullWidth variant="outlined" startIcon={<SkipNext />} onClick={() => setTimeLeft(0)}>
            Pause überspringen
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />
      <Typography variant="body2" align="center" color="text.secondary">
        Nächste Übung: {exercises[currentIndex + 1]?.name || 'Ende'}
      </Typography>
    </Box>
  );
};

export default Workout;