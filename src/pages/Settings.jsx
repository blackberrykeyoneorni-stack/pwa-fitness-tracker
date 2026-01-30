import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WEEKDAYS } from '../db';
import { exportData } from '../utils/exportManager';
import {
  Box, Typography, Tabs, Tab, List, ListItem, ListItemText,
  IconButton, Fab, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Card, CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  FileDownload as CsvIcon,
  DataObject as JsonIcon
} from '@mui/icons-material';

export default function Settings() {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Formular Status
  const [formData, setFormData] = useState({
    name: '',
    day: WEEKDAYS[0],
    targetSets: 3,
    targetReps: 10,
    targetWeight: 0
  });

  // Datenbank Abfrage: Alle Übungen
  const exercises = useLiveQuery(() => db.exercises.toArray());

  // Filterung der Übungen nach ausgewähltem Tab (Wochentag)
  const currentDayName = WEEKDAYS[currentTab];
  const daysExercises = exercises?.filter(ex => ex.day === currentDayName) || [];

  const handleOpen = (exercise = null) => {
    if (exercise) {
      setEditingId(exercise.id);
      setFormData({
        name: exercise.name,
        day: exercise.day,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        targetWeight: exercise.targetWeight
      });
    } else {
      setEditingId(null);
      // Standardwerte für neue Übung, Tag wird vom aktuellen Tab übernommen
      setFormData({
        name: '',
        day: currentDayName,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 0
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    if (editingId) {
      await db.exercises.update(editingId, formData);
    } else {
      await db.exercises.add(formData);
    }
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Übung wirklich löschen?')) {
      await db.exercises.delete(id);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, px: 2, pt: 2 }}>
        Trainingsplan & Daten
      </Typography>

      {/* Export Sektion */}
      <Card sx={{ mx: 2, mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Daten-Export
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<CsvIcon />} 
              onClick={() => exportData('csv')}
              fullWidth
            >
              CSV
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<JsonIcon />} 
              onClick={() => exportData('json')}
              fullWidth
            >
              JSON
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ px: 2, mb: 1 }}>
        Routinen konfigurieren
      </Typography>

      {/* Wochentag Tabs */}
      <Tabs
        value={currentTab}
        onChange={(e, v) => setCurrentTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {WEEKDAYS.map((day, index) => (
          <Tab key={day} label={day} />
        ))}
      </Tabs>

      {/* Übungsliste */}
      <List sx={{ px: 2 }}>
        {daysExercises.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Keine Übungen für {currentDayName} definiert.
          </Typography>
        )}
        {daysExercises.map((ex) => (
          <Card key={ex.id} sx={{ mb: 1 }}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleOpen(ex)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(ex.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={ex.name}
                secondary={`${ex.targetSets} x ${ex.targetReps} Wdh ${ex.targetWeight > 0 ? `@ ${ex.targetWeight}kg` : ''}`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          </Card>
        ))}
      </List>

      {/* Floating Action Button zum Hinzufügen */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => handleOpen(null)}
      >
        <AddIcon />
      </Fab>

      {/* Dialog für Erstellen/Editieren */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? 'Übung bearbeiten' : 'Neue Übung'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name der Übung"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Wochentag</InputLabel>
              <Select
                value={formData.day}
                label="Wochentag"
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                {WEEKDAYS.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Zielsätze"
                type="number"
                fullWidth
                value={formData.targetSets}
                onChange={(e) => setFormData({ ...formData, targetSets: Number(e.target.value) })}
              />
              <TextField
                label="Ziel Wdh."
                type="number"
                fullWidth
                value={formData.targetReps}
                onChange={(e) => setFormData({ ...formData, targetReps: Number(e.target.value) })}
              />
            </Box>

            <TextField
              label="Standard Zusatzgewicht (kg)"
              type="number"
              fullWidth
              helperText="0 für reines Eigengewicht"
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
