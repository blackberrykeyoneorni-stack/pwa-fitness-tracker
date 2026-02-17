import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, IconButton, Slider, Chip, Alert, AlertTitle
} from '@mui/material';
import { Close as CloseIcon, SkipNext, FilterList, TrendingUp, Speed, Whatshot, BatteryAlert, PlayArrow, Stop } from '@mui/icons-material';
import { db } from '../db';
import { useTheme } from '@mui/material/styles';

const Workout = () => {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState(new Set());
  const [dailyNote, setDailyNote] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Workout State
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentSet, setCurrentSet] = useState(1);
  
  // --- NEU: Dual-Timer State Machine ---
  const [timerMode, setTimerMode] = useState('idle'); // 'idle', 'work', 'rest'
  const [timeLeft, setTimeLeft] = useState(0);
  const [actualTimeDone, setActualTimeDone] = useState(0);
  
  // Progression & RPE Logic
  const [isProgressionStep, setIsProgressionStep] = useState(false);
  const [progressionDelta, setProgressionDelta] = useState(0);
  const [rpe, setRpe] = useState(8); 
  const [coachRecommendation, setCoachRecommendation] = useState(null);

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

  // --- TIMER ENGINE ---
  useEffect(() => {
    let timer;
    if (timerMode !== 'idle' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerMode !== 'idle') {
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [timerMode, timeLeft]);

  useEffect(() => {
    if (!selectedExercise || !isProgressionStep) return;
    const baseStep = selectedExercise.isTime ? 5 : 2.5;
    let suggestedDelta = 0;

    if (rpe <= 6) suggestedDelta = baseStep * 2;     
    else if (rpe <= 9) suggestedDelta = baseStep;     
    else suggestedDelta = 0;                          

    setProgressionDelta(suggestedDelta);
  }, [rpe, isProgressionStep, selectedExercise]);


  const analyzeHistoryAndSuggest = async (exercise) => {
    const history = await db.logs
      .where('exerciseId').equals(exercise.id)
      .reverse()
      .limit(5)
      .toArray();

    if (history.length === 0) {
      setCoachRecommendation(null);
      return;
    }

    const lastLog = history[0];
    const baseStep = exercise.isTime ? 5 : 2.5;

    if (history.length >= 3) {
      const recentStrain = history.slice(0, 3);
      const isBurnoutRisk = recentStrain.every(log => (log.rpe || 0) >= 9);

      if (isBurnoutRisk) {
        const deloadAmount = exercise.isWeight 
          ? -Math.round((exercise.targetWeight || 0) * 0.1) 
          : -10; 
        
        setCoachRecommendation({
          type: 'burnout',
          title: 'Hohe Belastung erkannt',
          message: 'Deine letzten 3 Einheiten waren am Limit. Der Coach empfiehlt heute einen Deload (-10%), um das ZNS zu regenerieren.',
          delta: deloadAmount
        });
        return;
      }
    }

    if ((lastLog.rpe || 0) <= 6 && lastLog.rpe > 0) {
      setCoachRecommendation({
        type: 'aggressive',
        title: 'Potenzial erkannt',
        message: 'Das letzte Training war sehr leicht (RPE ≤ 6). Der Coach empfiehlt heute eine doppelte Steigerung.',
        delta: baseStep * 2
      });
      return;
    }

    setCoachRecommendation(null);
  };

  // --- WORKOUT STATE LOGIC ---
  const finishSetAndMoveOn = () => {
    if (currentSet < selectedExercise.sets) {
      setTimerMode('rest');
      setTimeLeft(selectedExercise.restTime);
    } else {
      setTimerMode('idle');
      setIsProgressionStep(true);
      setRpe(8);
    }
  };

  const handleTimerComplete = () => {
    if (timerMode === 'work') {
      setActualTimeDone(selectedExercise.targetTime);
      finishSetAndMoveOn();
    } else if (timerMode === 'rest') {
      setTimerMode('idle');
      setCurrentSet(prev => prev + 1);
    }
  };

  const handleNextStep = () => {
    if (selectedExercise.isTime) {
      setTimerMode('work');
      setTimeLeft(selectedExercise.targetTime);
      setActualTimeDone(0); // Reset für diesen Satz
    } else {
      finishSetAndMoveOn();
    }
  };

  const handleStopWork = () => {
    const done = selectedExercise.targetTime - timeLeft;
    setActualTimeDone(done > 0 ? done : 0);
    finishSetAndMoveOn();
  };

  const handleFinishEarly = () => {
    setTimerMode('idle');
    setIsProgressionStep(true);
    setRpe(8);
  };

  const finishExercise = async () => {
    await db.logs.add({
      date: todayDate,
      exerciseId: selectedExercise.id,
      weight: selectedExercise.isWeight ? (selectedExercise.targetWeight || 0) : null,
      time: selectedExercise.isTime ? (actualTimeDone > 0 ? actualTimeDone : (selectedExercise.targetTime || 0)) : null,
      reps: selectedExercise.reps || 0,
      sets: currentSet,
      rpe: rpe
    });

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
    setTimerMode('idle');
    setIsProgressionStep(false);
    setProgressionDelta(0);
    setRpe(8);
    setActualTimeDone(0);
    analyzeHistoryAndSuggest(ex);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setTimerMode('idle');
    setIsProgressionStep(false);
    setCoachRecommendation(null);
  };

  const handleSaveNote = async () => {
    await db.dailyNotes.put({ date: todayDate, note: dailyNote });
  };

  const getRpeColor = (val) => {
    if (val <= 6) return theme.palette.success.main; 
    if (val <= 8.5) return theme.palette.warning.main; 
    return theme.palette.error.main; 
  };

  const getRpeLabel = (val) => {
    if (val <= 6) return "Leicht (Warmup)";
    if (val <= 7) return "Moderat (3 RIR)";
    if (val <= 8) return "Hart (2 RIR)";
    if (val <= 9) return "Sehr Hart (1 RIR)";
    return "Limit (Failure)";
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
              {!isProgressionStep && coachRecommendation && timerMode === 'idle' && currentSet === 1 && (
                <Alert 
                  severity={coachRecommendation.type === 'burnout' ? 'error' : 'info'} 
                  icon={coachRecommendation.type === 'burnout' ? <BatteryAlert fontSize="inherit" /> : <Whatshot fontSize="inherit" />}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  <AlertTitle sx={{ fontWeight: 'bold' }}>{coachRecommendation.title}</AlertTitle>
                  {coachRecommendation.message}
                </Alert>
              )}

              {!isProgressionStep ? (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    {/* --- VISUALISIERUNG: DUAL TIMER --- */}
                    <Box sx={{
                      p: 4, borderRadius: '50%', textAlign: 'center', width: 140, height: 140,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      border: '6px solid', 
                      borderColor: timerMode === 'work' ? 'primary.light' : (timerMode === 'rest' ? 'secondary.main' : 'primary.main'), 
                      bgcolor: timerMode === 'work' ? 'primary.main' : 'background.default',
                      color: timerMode === 'work' ? 'primary.contrastText' : 'text.primary',
                      transition: 'all 0.3s ease'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {timerMode !== 'idle' ? timeLeft : currentSet}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.9 }}>
                        {timerMode === 'work' ? 'ARBEIT' : timerMode === 'rest' ? 'PAUSE' : `SATZ / ${selectedExercise.sets}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    Ziel: {selectedExercise.isTime ? `${selectedExercise.targetTime}s` : `${selectedExercise.reps} Wdh.`}
                    {selectedExercise.isWeight && selectedExercise.targetWeight ? ` @ ${selectedExercise.targetWeight}kg` : ''}
                  </Typography>
                  
                  {timerMode !== 'idle' && (
                    <Box sx={{ mt: 3, width: '100%' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={
                          timerMode === 'work' 
                            ? (timeLeft / selectedExercise.targetTime) * 100 
                            : (timeLeft / selectedExercise.restTime) * 100
                        } 
                        sx={{ 
                          height: 12, borderRadius: 6, mb: 1,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                             bgcolor: timerMode === 'work' ? 'primary.main' : 'secondary.main'
                          }
                        }} 
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  
                  {/* --- RPE SLIDER --- */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Speed fontSize="small" /> Intensität (RPE)
                  </Typography>
                  
                  <Box sx={{ px: 2, mb: 4 }}>
                    <Slider
                      value={rpe}
                      min={5}
                      max={10}
                      step={0.5}
                      onChange={(e, val) => setRpe(val)}
                      valueLabelDisplay="on"
                      track={false}
                      sx={{
                        height: 8,
                        '& .MuiSlider-thumb': {
                          width: 24, height: 24,
                          backgroundColor: getRpeColor(rpe),
                          border: '2px solid #fff'
                        },
                        '& .MuiSlider-valueLabel': {
                          bgcolor: getRpeColor(rpe),
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: getRpeColor(rpe), fontWeight: 'bold', mt: 1, display: 'block' }}>
                      {getRpeLabel(rpe)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* --- PROGRESSION SLIDER --- */}
                  <TrendingUp color="primary" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {progressionDelta > 0 ? "Empfohlene Steigerung" : "Anpassung"}
                  </Typography>
                  
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={progressionDelta}
                      min={selectedExercise.isTime ? -30 : -5}
                      max={selectedExercise.isTime ? 60 : 15}
                      step={selectedExercise.isTime ? 5 : 1.25} 
                      onChange={(e, val) => setProgressionDelta(val)}
                      valueLabelDisplay="auto"
                      marks
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                    <Chip 
                      label={`${progressionDelta > 0 ? '+' : ''}${progressionDelta} ${selectedExercise.isTime ? 's' : 'kg'}`} 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2, px: 1, borderRadius: 2 }} 
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Neues Ziel: {selectedExercise.isTime 
                      ? (selectedExercise.targetTime + progressionDelta) + 's' 
                      : (selectedExercise.targetWeight + progressionDelta) + 'kg'}
                  </Typography>

                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              
              {/* --- AKTIONEN WÄHREND DER ÜBUNG --- */}
              {!isProgressionStep && (
                <>
                  {timerMode === 'idle' && (
                    <Button fullWidth variant="contained" size="large" onClick={handleNextStep} startIcon={selectedExercise.isTime ? <PlayArrow /> : null} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
                      {selectedExercise.isTime ? `Timer für Satz ${currentSet} starten` : `Satz ${currentSet} abschließen`}
                    </Button>
                  )}

                  {timerMode === 'work' && (
                    <Button fullWidth variant="contained" color="warning" size="large" onClick={handleStopWork} startIcon={<Stop />} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
                      Arbeitssatz beenden
                    </Button>
                  )}

                  {timerMode === 'rest' && (
                    <Button fullWidth variant="outlined" size="large" onClick={() => setTimeLeft(0)} startIcon={<SkipNext />} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
                      Pause überspringen
                    </Button>
                  )}
                  
                  {timerMode !== 'rest' && currentSet < selectedExercise.sets && (
                    <Button fullWidth variant="text" size="small" onClick={handleFinishEarly} sx={{ mt: 1, borderRadius: 2, color: 'text.secondary', fontWeight: 'bold' }}>
                      Übung vorzeitig beenden
                    </Button>
                  )}
                </>
              )}

              {/* --- AKTIONEN IM PROGRESSIONSSCHRITT --- */}
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

const Divider = ({ sx }) => <Box sx={{ height: '1px', bgcolor: 'divider', width: '100%', ...sx }} />;

export default Workout;