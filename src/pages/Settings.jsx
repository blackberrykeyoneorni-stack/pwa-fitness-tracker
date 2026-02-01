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
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Save as SaveIcon 
} from '@mui/icons-material';
import { db, WEEKDAYS } from '../db';
import { exportData, exportCSV } from '../utils/exportManager';

const Settings = () => {
  const [exercises, setExercises] = useState([]);
  const [editId, setEditId] = useState(null);
  const [newEx, setNewEx] = useState({
    name: '', sets: 3, reps: 10, restTime: 60,
    isWeight: false, isTime: false, targetWeight: 0, targetTime: 0,
    days: []
  });
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const allEx = await db.exercises.toArray();
        setExercises(allEx);
      } catch (error) {
        console.error("Fehler beim Laden der Übungen:", error);
      }
    };
    loadData();
  }, []);

  const handleAddExercise = async () => {
    if (!newEx.name || !newEx.days || newEx.days.length === 0) {
      setStatus({ open: true, message: 'Name und Trainingstage erforderlich!', severity: 'error' });
      return;
    }
    const id = await db.exercises.add(newEx);
    setExercises([...exercises, { ...newEx, id }]);
    resetForm();
    setStatus({ open: true, message: 'Übung hinzugefügt!', severity: 'success' });
  };

  const handleEditClick = (ex) => {
    setEditId(ex.id);
    setNewEx({ ...ex });
  };

  const handleUpdateExercise = async () => {
    if (!newEx.name || !newEx.days || newEx.days.length === 0) return;
    try {
      await db.exercises.update(editId, newEx);
      const allEx = await db.exercises.toArray();
      setExercises(allEx);
      resetForm();
      setStatus({ open: true, message: 'Übung aktualisiert!', severity: 'success' });
    } catch (error) {
      setStatus({ open: true, message: 'Fehler beim Speichern!', severity: 'error' });
    }
  };

  const resetForm = () => {
    setEditId(null);
    setNewEx({
      name: '', sets: 3, reps: 10, restTime: 60,
      isWeight: false, isTime: false, targetWeight: 0, targetTime: 0,
      days: []
    });
  };

  const handleDeleteExercise = async (id) => {
    await db.exercises.delete(id);
    setExercises(exercises.filter(ex => ex.id !== id));
    if (editId === id) resetForm();
  };

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Einstellungen</Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editId ? 'Übung bearbeiten' : 'Übungen Verwalten'}
        </Typography>
        <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
          <TextField label="Name der Übung" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} size="small" />
          
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel>Trainingstage</InputLabel>
            <Select
              multiple value={newEx.days}
              onChange={(e) => setNewEx({ ...newEx, days: e.target.value })}
              input={<OutlinedInput label="Trainingstage" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" color="primary" />)}
                </Box>
              )}
            >
              {WEEKDAYS.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={newEx.isWeight} onChange={(e) => setNewEx({ ...newEx, isWeight: e.target.checked })} />}
              label="Gewicht"
            />
            <FormControlLabel
              control={<Checkbox checked={newEx.isTime} onChange={(e) => setNewEx({ ...newEx, isTime: e.target.checked })} />}
              label="Zeit"
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
          
          {editId ? (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={handleUpdateExercise} color="success">Speichern</Button>
              <Button variant="outlined" fullWidth onClick={resetForm}>Abbrechen</Button>
            </Box>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddExercise} sx={{ mt: 1 }}>Übung Hinzufügen</Button>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {exercises.map((ex) => (
            <ListItem key={ex.id}>
              <ListItemText
                primary={ex.name}
                secondary={`${ex.sets} Sätze | ${ex.isTime ? `${ex.targetTime}s` : `${ex.reps} Wdh.`}${ex.isWeight ? ` @ ${ex.targetWeight}kg` : ''} | ${ex.days?.join(', ')}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEditClick(ex)} sx={{ mr: 1 }}><EditIcon /></IconButton>
                <IconButton edge="end" onClick={() => handleDeleteExercise(ex.id)}><DeleteIcon /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Datenverwaltung</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={exportData}>Exportieren (.json)</Button>
          <Button fullWidth variant="outlined" onClick={exportCSV}>Exportieren (.csv)</Button>
        </Box>
      </Paper>

      <Snackbar open={status.open} autoHideDuration={3000} onClose={() => setStatus({ ...status, open: false })}>
        <Alert severity={status.severity}>{status.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;