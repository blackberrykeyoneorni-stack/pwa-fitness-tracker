import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { db } from '../db';
import { exportData, importData, exportCSV } from '../utils/exportManager';

const DAYS_OF_WEEK = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const Settings = () => {
  const [settings, setSettings] = useState({ userName: '', trainingDays: [] });
  const [exercises, setExercises] = useState([]);
  const [newEx, setNewEx] = useState({
    name: '', sets: 3, reps: 10, restTime: 60,
    isWeight: false, isTime: false, targetWeight: 0, targetTime: 0
  });
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadData = async () => {
      const savedSettings = await db.settings.get('user_settings');
      if (savedSettings) setSettings(savedSettings.value);
      const allEx = await db.exercises.toArray();
      setExercises(allEx);
    };
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    await db.settings.put({ id: 'user_settings', value: settings });
    setStatus({ open: true, message: 'Profil gespeichert!', severity: 'success' });
  };

  const handleAddExercise = async () => {
    if (!newEx.name) return;
    const id = await db.exercises.add(newEx);
    setExercises([...exercises, { ...newEx, id }]);
    setNewEx({
      name: '', sets: 3, reps: 10, restTime: 60,
      isWeight: false, isTime: false, targetWeight: 0, targetTime: 0
    });
  };

  const handleDeleteExercise = async (id) => {
    await db.exercises.delete(id);
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Einstellungen</Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6">Profil & Trainingstage</Typography>
        <TextField
          fullWidth label="Name" value={settings.userName}
          onChange={(e) => setSettings({ ...settings, userName: e.target.value })} margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Trainingstage</InputLabel>
          <Select
            multiple value={settings.trainingDays}
            onChange={(e) => setSettings({ ...settings, trainingDays: e.target.value })}
            input={<OutlinedInput label="Trainingstage" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => <Chip key={value} label={value} size="small" color="primary" />)}
              </Box>
            )}
          >
            {DAYS_OF_WEEK.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" fullWidth onClick={handleSaveSettings} sx={{ mt: 1 }}>Profil Speichern</Button>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Übungen Verwalten</Typography>
        <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
          <TextField label="Name der Übung" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} size="small" />
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={newEx.isWeight} onChange={(e) => setNewEx({ ...newEx, isWeight: e.target.checked })} />}
              label="Gewicht"
            />
            <FormControlLabel
              control={<Checkbox checked={newEx.isTime} onChange={(e) => setNewEx({ ...newEx, isTime: e.target.checked })} />}
              label="Zeit statt Wdh."
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField label="Sätze" type="number" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: parseInt(e.target.value) || 0 })} size="small" sx={{ width: '80px' }} />

            {!newEx.isTime ? (
              <TextField label="Wdh." type="number" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: parseInt(e.target.value) || 0 })} size="small" sx={{ width: '80px' }} />
            ) : (
              <TextField label="Zeit (s)" type="number" value={newEx.targetTime} onChange={(e) => setNewEx({ ...newEx, targetTime: parseInt(e.target.value) || 0 })} size="small" sx={{ width: '100px' }} />
            )}

            {newEx.isWeight && (
              <TextField label="Gewicht (kg)" type="number" value={newEx.targetWeight} onChange={(e) => setNewEx({ ...newEx, targetWeight: parseFloat(e.target.value) || 0 })} size="small" sx={{ width: '100px' }} />
            )}

            <TextField label="Pause (s)" type="number" value={newEx.restTime} onChange={(e) => setNewEx({ ...newEx, restTime: parseInt(e.target.value) || 0 })} size="small" sx={{ width: '90px' }} />
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddExercise}>Hinzufügen</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {exercises.map((ex) => (
            <ListItem key={ex.id}>
              <ListItemText
                primary={ex.name}
                secondary={
                  `${ex.sets} Sätze` +
                  (ex.isTime ? ` à ${ex.targetTime}s` : ` à ${ex.reps} Wdh.`) +
                  (ex.isWeight && ex.targetWeight ? ` @ ${ex.targetWeight}kg` : '') +
                  ` (${ex.restTime}s Pause)`
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDeleteExercise(ex.id)}><DeleteIcon /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Daten</Typography>
        <Button fullWidth variant="text" onClick={exportData}>Exportieren (.json)</Button>
        <Button fullWidth variant="text" onClick={exportCSV}>Exportieren (.csv)</Button>
      </Paper>

      <Snackbar open={status.open} autoHideDuration={3000} onClose={() => setStatus({ ...status, open: false })}>
        <Alert severity={status.severity}>{status.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;