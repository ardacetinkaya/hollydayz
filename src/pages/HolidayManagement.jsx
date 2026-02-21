import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabaseClient';
import { format, parseISO } from 'date-fns';
import { isUserAdmin } from '../utils/adminUtils';

const HolidayManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    date: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const availableYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const adminStatus = await isUserAdmin(user);
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        loadHolidays();
      } else {
        setLoading(false);
      }
    };
    
    checkAdminAndLoad();
  }, [user, selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('year', selectedYear)
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (err) {
      setError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: ''
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.name || !formData.date) {
        setError('Name and date are required');
        return;
      }

      const date = parseISO(formData.date);
      const year = date.getFullYear();

      if (editingHoliday) {
        // Update existing holiday
        const { error } = await supabase
          .from('holidays')
          .update({
            name: formData.name,
            date: formData.date,
            year: year
          })
          .eq('id', editingHoliday.id);

        if (error) throw error;
        setSuccess('Holiday updated successfully');
      } else {
        // Create new holiday
        const { error } = await supabase
          .from('holidays')
          .insert({
            name: formData.name,
            date: formData.date,
            year: year,
            country: 'ALL',
            is_active: true
          });

        if (error) throw error;
        setSuccess('Holiday added successfully');
      }

      await loadHolidays();
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save holiday');
    }
  };

  const handleDelete = async (holidayId) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;
      
      setSuccess('Holiday deleted successfully');
      setDeleteConfirm(null);
      await loadHolidays();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete holiday');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading holidays...</Typography>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You do not have permission to access this page. Only administrators can manage holidays.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Holiday Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Holiday
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ minWidth: 100 }}
            >
              Back
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Success/Error Messages */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Holidays Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id} hover>
                    <TableCell>{format(parseISO(holiday.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>{holiday.country}</TableCell>
                    <TableCell>
                      <Chip
                        label={holiday.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={holiday.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(holiday)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirm(holiday)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No holidays found for {selectedYear}. Click "Add Holiday" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Holiday Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            label="Holiday Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            required
            placeholder="e.g., New Year's Day"
          />
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || !formData.date}>
            {editingHoliday ? 'Update' : 'Add'} Holiday
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HolidayManagement;
