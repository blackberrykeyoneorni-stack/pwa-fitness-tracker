import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, OutlinedInput, Chip, IconButton, List, ListItem,
  ListItemText, ListItemSecondaryAction, Divider, Snackbar, Alert,
  Checkbox, FormControlLabel, Tabs, Tab
} from '@mui/material';
import {
  Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon,
  Save as SaveIcon, SaveAlt, FileUpload, TableChart,
  Backup, CheckCircle, Warning, Error as ErrorIcon
} from '@mui/icons-material';
import { db, WEEKDAYS } from '../db';
import { exportData, exportCSV, importData, getLastBackupDate } from '../utils/exportManager';

const Settings = () => {
  // --- STATE: Übungsverwaltung ---
  const [exercises, setExercises] = useState([]);
  const [editId, setEditId] = useState(null);
  const [newEx, setNewEx] = useState({
    name: '', sets: 3, reps: 10, restTime: 60,
    isWeight: false, isTime: false, targetWeight: 0, targetTime: 0,
    days: []
  });
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  // --- STATE: Backup System ---
  const [lastBackup, setLastBackup] = useState(null);
  const [backupStatus, setBackupStatus] = useState('unknown'); // 'good', 'warning', 'critical'

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const allEx = await db.exercises.toArray();
        setExercises(allEx);
        refreshBackupStatus();
      } catch (error) {
        console.error("Datenbankfehler:", error);
      }
    };
    loadData();
  }, []);

  // --- LOGIC: Backup System ---
  const refreshBackupStatus = () => {
    const dateStr = getLastBackupDate();
    if (!dateStr) {
      setLastBackup(null);
      setBackupStatus('critical');
      return;
    }
    const date = new Date(dateStr);
    setLastBackup(date);
    const diffDays = (new Date() - date) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) setBackupStatus('good');
    else if (diffDays < 30) setBackupStatus('warning');
    else setBackupStatus('critical');
  };

  const handleExport = async () => {
    const success = await exportData();
    if (success) {
      refreshBackupStatus();
      setStatus({ open: true, message: 'Backup erfolgreich erstellt!', severity: 'success' });
    }
  };

  const handleCSV = async () => {
    const success = await exportCSV();
    if (success) setStatus({ open: true, message: 'CSV Export erstellt!', severity: 'success' });
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file && window.confirm("Achtung: Dadurch werden alle aktuellen Daten überschrieben! Fortfahren?")) {
      const success = await importData(file);
      if (success) {
        alert('Daten erfolgreich importiert!');
        window.location.reload();
      } else {
        setStatus({ open: true, message: 'Import fehlgeschlagen!', severity: 'error' });
      }
    }
  };

  // --- LOGIC: Übungsverwaltung ---
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
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleDeleteExercise = async (id) => {
    if (window.confirm("Übung wirklich löschen?")) {
      await db.exercises.delete(id);
      setExercises(exercises.filter(ex => ex.id !== id));
      if (editId === id) resetForm();
      setStatus({ open: true, message: 'Übung gelöscht', severity: 'info' });
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

  // --- HELPER: UI Status ---
  const getStatusIcon = () => {
    switch(backupStatus) {
      case 'good': return <CheckCircle fontSize="small" />;
      case 'warning': return <Warning fontSize="small" />;
      case 'critical': return <ErrorIcon fontSize="small" />;
      default: return <Backup fontSize="small" />;
    }
  };

  const getStatusColor = () => {
    switch(backupStatus) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        Einstellungen
      </Typography>

      {/* --- SECTION 1: BACKUP & DATEN --- */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Backup /> Backup & Daten
          </Typography>
          <Chip 
            icon={getStatusIcon()} 
            label={backupStatus === 'good' ? 'Gesichert' : (backupStatus === 'critical' ? 'Kein Backup!' : 'Veraltet')}
            color={getStatusColor()} 
            variant="outlined" 
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        {lastBackup && (
          <Typography variant="caption" display="block" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
            Letztes Backup: {lastBackup.toLocaleDateString('de-DE')} um {lastBackup.toLocaleTimeString('de-DE')} Uhr
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button 
            variant="contained" startIcon={<SaveAlt />} onClick={handleExport} fullWidth
            sx={{ borderRadius: 2 }}
          >
            Backup erstellen (JSON)
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
             <Button 
              variant="outlined" component="label" startIcon={<FileUpload />} fullWidth
              sx={{ borderRadius: 2 }}
            >
              Import
              <input type="file" hidden accept=".json" onChange={handleImport} />
            </Button>
            <Button 
              variant="outlined" startIcon={<TableChart />} onClick={handleCSV} fullWidth
              sx={{ borderRadius: 2 }}
            >
              CSV Export
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* --- SECTION 2: ÜBUNGSVERWALTUNG --- */}
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {editId ? 'Übung bearbeiten' : 'Neue Übung anlegen'}
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <TextField 
            label="Name der Übung" variant="outlined" fullWidth
            value={newEx.name} 
            onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} 
          />
          
          <FormControl fullWidth size="small">
            <InputLabel>Trainingstage</InputLabel>
            <Select
              multiple value={newEx.days}
              onChange={(e) => setNewEx({ ...newEx, days: e.target.value })}
              input={<OutlinedInput label="Trainingstage" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}
            >
              {WEEKDAYS.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={newEx.isWeight} onChange={(e) => setNewEx({ ...newEx, isWeight: e.target.checked })} />}
              label="Gewicht?"
            />
            <FormControlLabel
              control={<Checkbox checked={newEx.isTime} onChange={(e) => setNewEx({ ...newEx, isTime: e.target.checked })} />}
              label="Zeit/Dauer?"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Sätze" type="number" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: parseInt(e.target.value) || 0 })} size="small" />
            <TextField label="Pause (s)" type="number" value={newEx.restTime} onChange={(e) => setNewEx({ ...newEx, restTime: parseInt(e.target.value) || 0 })} size="small" />
            
            {!newEx.isTime ? (
              <TextField label="Wdh." type="number" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: parseInt(e.target.value) || 0 })} size="small" />
            ) : (
              <TextField label="Ziel-Zeit (s)" type="number" value={newEx.targetTime} onChange={(e) => setNewEx({ ...newEx, targetTime: parseInt(e.target.value) || 0 })} size="small" />
            )}
            
            {newEx.isWeight && (
              <TextField label="Start-Gewicht (kg)" type="number" value={newEx.targetWeight} onChange={(e) => setNewEx({ ...newEx, targetWeight: parseFloat(e.target.value) || 0 })} size="small" />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {editId ? (
              <>
                <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={handleUpdateExercise} color="success">Update speichern</Button>
                <Button variant="outlined" fullWidth onClick={resetForm}>Abbrechen</Button>
              </>
            ) : (
              <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddExercise} size="large">Hinzufügen</Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }}>Übungs-Liste</Divider>

        <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
          {exercises.map((ex) => (
            <React.Fragment key={ex.id}>
              <ListItem 
                alignItems="flex-start"
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => handleEditClick(ex)} sx={{ mr: 1 }}><EditIcon /></IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteExercise(ex.id)}><DeleteIcon /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight="bold">{ex.name}</Typography>}
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {ex.sets}x {ex.isTime ? `${ex.targetTime}s` : `${ex.reps}`} 
                      {ex.isWeight ? ` @ ${ex.targetWeight}kg` : ''} • {ex.days?.join(', ')}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider component="li" variant="inset" />
            </React.Fragment>
          ))}
          {exercises.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              Noch keine Übungen angelegt.
            </Typography>
          )}
        </List>
      </Paper>

      <Snackbar open={status.open} autoHideDuration={3000} onClose={() => setStatus({ ...status, open: false })}>
        <Alert severity={status.severity} variant="filled" sx={{ width: '100%' }}>{status.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;