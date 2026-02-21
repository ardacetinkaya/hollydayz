import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  IconButton, 
  Chip,
  Avatar,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Today,
  Clear,
  Check,
  Close
} from '@mui/icons-material';
import { 
  format, 
  startOfWeek, 
  addDays, 
  addWeeks, 
  subWeeks, 
  isToday, 
  isWeekend,
  getWeek,
  parseISO
} from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { useEffect } from 'react';

function CalendarView() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [timeOffType, setTimeOffType] = useState('vacation');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // New state for loading and displaying time-off requests
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // State for range selection
  const [lastClickedDate, setLastClickedDate] = useState(null);

  // State for holidays
  const [holidays, setHolidays] = useState([]);

  // Load time-off requests and holidays when component mounts or week changes
  useEffect(() => {
    if (user && user.id) {
      loadTimeOffRequests();
      loadHolidays();
    }
  }, [user, currentWeek]);

  const loadHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const holidayData = await supabaseService.getHolidays(currentYear);
      setHolidays(holidayData);
    } catch (error) {
      // Silently fail - holidays are optional
    }
  };

  const loadTimeOffRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get first day of first week and last day of second week
      const firstDay = currentWeek;
      const lastDay = addDays(addWeeks(currentWeek, 2), -1); // End of 2 weeks
      
      const requests = await supabaseService.getTimeOffRequests(
        format(firstDay, 'yyyy-MM-dd'),
        format(lastDay, 'yyyy-MM-dd')
      );
      
      setTimeOffRequests(requests || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (request) => {
    setRequestToDelete(request);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      await supabaseService.deleteTimeOffRequest(requestToDelete.id);
      
      // Reload data
      await loadTimeOffRequests();
      
      setDeleteModalOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      alert('Failed to delete request: ' + error.message);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  // Check if a date is a holiday
  const isHoliday = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(h => h.date === dateStr && h.is_active);
  };

  // Check if a date is already requested
  const isDateRequested = (date) => {
    if (!user) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeOffRequests.find(request => {
      const requestDate = format(parseISO(request.start_date), 'yyyy-MM-dd');
      const endDate = format(parseISO(request.end_date), 'yyyy-MM-dd');
      return dateStr >= requestDate && dateStr <= endDate && request.user_id === user.id;
    });
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 2));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 2));
  };

  const goToToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const clearSelectedDays = () => {
    setSelectedDays(new Set());
  };

  const openSummaryModal = () => {
    setSummaryModalOpen(true);
  };

  const closeSummaryModal = () => {
    setSummaryModalOpen(false);
  };

  const handleSubmitTimeOff = async () => {
    if (!user || !user.id) {
      setSubmitError('User not authenticated');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Convert selected days to array of date strings
      const dates = Array.from(selectedDays).sort();
      
      // Check for duplicate requests
      const duplicateDates = dates.filter(dateStr => {
        const date = parseISO(dateStr);
        return isDateRequested(date);
      });
      
      if (duplicateDates.length > 0) {
        setSubmitError(`You have already requested time off for: ${duplicateDates.map(d => format(parseISO(d), 'MMM d')).join(', ')}`);
        setSubmitting(false);
        return;
      }
      
      
      // Create time off requests in Supabase
      const result = await supabaseService.createTimeOffRequest(
        user.id,
        dates,
        timeOffType,
        notes
      );
      
      
      setSubmitSuccess(true);
      
      // Reload calendar data
      await loadTimeOffRequests();
      
      // Clear form after successful submission
      setTimeout(() => {
        closeSummaryModal();
        clearSelectedDays();
        setNotes('');
        setTimeOffType('vacation');
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit time off request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDayClick = (date, event) => {
    // Don't allow selection of weekends
    if (isWeekend(date)) {
      return;
    }

    // Don't allow selection of holidays
    if (isHoliday(date)) {
      return;
    }
    
    // Check if this day already has a request
    const existingRequest = isDateRequested(date);
    if (existingRequest) {
      // If it's pending, allow user to delete it
      if (existingRequest.status === 'pending' && existingRequest.user_id === user.id) {
        handleDeleteRequest(existingRequest);
      }
      return;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    const newSelected = new Set(selectedDays);
    
    // Check if Shift key is pressed for range selection
    if (event?.shiftKey && lastClickedDate) {
      // Select range between lastClickedDate and current date
      const start = new Date(Math.min(date, new Date(lastClickedDate)));
      const end = new Date(Math.max(date, new Date(lastClickedDate)));
      
      // Add all dates in range (excluding weekends and holidays)
      let current = new Date(start);
      while (current <= end) {
        if (!isWeekend(current) && !isHoliday(current)) {
          const currentStr = format(current, 'yyyy-MM-dd');
          // Check if date already has a request
          const hasRequest = isDateRequested(current);
          if (!hasRequest) {
            newSelected.add(currentStr);
          }
        }
        current = addDays(current, 1);
      }
    } else {
      // Single day selection
      if (newSelected.has(dateString)) {
        newSelected.delete(dateString);
      } else {
        newSelected.add(dateString);
      }
    }
    
    setSelectedDays(newSelected);
    setLastClickedDate(dateString);
  };

  const isDaySelected = (date) => {
    return selectedDays.has(format(date, 'yyyy-MM-dd'));
  };

  const renderDay = (date, isSecondWeek = false) => {
    const holiday = isHoliday(date);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const isSelected = isDaySelected(date);
    const requestedDay = isDateRequested(date);
    const isMyRequest = requestedDay && requestedDay.user_id === user?.id;
    const isPending = requestedDay?.status === 'pending';
    const isApproved = requestedDay?.status === 'approved';

    return (
      <Paper
        key={date.toString()}
        onClick={(e) => handleDayClick(date, e)}
        elevation={isCurrentDay ? 3 : (isSelected ? 2 : 1)}
        sx={{
          p: 2,
          width: '100%',
          minHeight: { xs: 100, sm: 120, md: 140 },
          height: { xs: 100, sm: 120, md: 140 },
          overflow: 'hidden',
          boxSizing: 'border-box',
          backgroundColor: holiday ? 'error.lighter' :
                         isApproved ? 'success.lighter' :
                         isPending && isMyRequest ? 'warning.lighter' :
                         isSelected ? 'primary.light' :
                         isCurrentDay ? 'primary.50' : 
                         isWeekendDay ? 'grey.100' : 
                         'background.paper',
          border: isPending && isMyRequest ? '2px dashed' : '2px solid',
          borderColor: holiday ? 'error.main' :
                      isApproved ? 'success.main' :
                      isPending && isMyRequest ? 'warning.main' :
                      isCurrentDay ? 'primary.main' : 
                      isSelected ? 'secondary.main' :
                      'grey.200',
          opacity: isWeekendDay || holiday ? 0.6 : 1,
          position: 'relative',
          cursor: isWeekendDay || holiday ? 'not-allowed' : 
                  (isPending && isMyRequest) ? 'pointer' : 
                  requestedDay ? 'default' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            backgroundColor: isWeekendDay || holiday ? (holiday ? 'error.lighter' : 'grey.100') :
                           (isPending && isMyRequest) ? 'warning.light' :
                           isApproved ? 'success.lighter' :
                           isSelected ? 'primary.light' :
                           'primary.50',
            elevation: isWeekendDay || holiday ? 1 : 2,
            transform: isWeekendDay || holiday ? 'none' : 'translateY(-1px)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 1,
          minHeight: 24
        }}>
          <Box sx={{ 
            minWidth: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            backgroundColor: isApproved ? 'success.main' :
                           isPending && isMyRequest ? 'warning.main' :
                           isSelected ? 'secondary.main' :
                           isCurrentDay ? 'primary.main' : 'transparent',
            color: (isSelected || isCurrentDay || (isPending && isMyRequest) || isApproved) ? 'white' : 
                   isWeekendDay ? 'grey.500' : 'text.primary'
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: (isCurrentDay || isSelected || requestedDay) ? 600 : 400,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {format(date, 'd')}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontWeight: 500
            }}
          >
            {format(date, 'EEE')}
          </Typography>
        </Box>

        {/* Show request status chip for user's own requests */}
        {isMyRequest && (
          <Chip 
            label={isPending ? 'Pending' : isApproved ? 'Accepted' : 'Rejected'}
            size="small"
            sx={{ 
              mb: 1,
              height: 20,
              maxWidth: '100%',
              fontSize: '0.65rem',
              backgroundColor: isPending ? 'warning.main' : 
                             isApproved ? 'success.main' : 'grey.500',
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-label': {
                px: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          />
        )}

        {holiday && (
          <Chip 
            label={holiday.name}
            size="small"
            sx={{ 
              mb: 1, 
              backgroundColor: 'error.light',
              color: 'error.dark',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: 'auto',
              '& .MuiChip-label': {
                px: 1,
                py: 0.5,
                whiteSpace: 'normal',
                lineHeight: 1.2
              }
            }}
          />
        )}

        {/* TODO: Show other team members' time-off here later */}
        
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
              ✓
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderWeek = (startDate, weekLabel, isSecondWeek = false) => {
    const days = [];
    const weekNumber = getWeek(startDate, { weekStartsOn: 1 });
    const year = format(startDate, 'yyyy');
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(renderDay(day, weekLabel === 'Week 2'));
    }

    return (
      <Box key={startDate.toString()} sx={{ width: '100%', minWidth: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 500, fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}>
            Week {weekNumber} - {format(startDate, 'MMM d')} to {format(addDays(startDate, 6), 'MMM d, yyyy')}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: { xs: 0.5, sm: 1 },
          width: '100%'
        }}>
          {days.map((day, index) => (
            <Box key={index} sx={{ minWidth: 0 }}>
              {day}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const firstWeek = currentWeek;
  const secondWeek = addWeeks(currentWeek, 1);

  // Get sorted selected dates for display
  const sortedSelectedDates = Array.from(selectedDays).sort().map(dateStr => parseISO(dateStr));

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '100%', xl: '1600px' },
      mx: 'auto'
    }}>
      {/* Calendar Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: { xs: 2, sm: 3 },
        backgroundColor: 'grey.50',
        borderRadius: 2,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <IconButton 
          onClick={goToPreviousWeek} 
          sx={{ color: 'primary.main' }}
          size="large"
        >
          <ChevronLeft />
        </IconButton>
        
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="h6" sx={{ color: 'primary.dark' }}>
            {format(firstWeek, 'MMMM yyyy')}
          </Typography>
          <Button 
            size="small" 
            startIcon={<Today />} 
            onClick={goToToday}
            sx={{ mt: 0.5 }}
          >
            Today
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedDays.size > 0 && (
            <Button 
              size="small" 
              startIcon={<Clear />} 
              onClick={clearSelectedDays}
              variant="outlined"
              sx={{ 
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  backgroundColor: 'secondary.light'
                }
              }}
            >
              Clear ({selectedDays.size})
            </Button>
          )}
          <IconButton 
            onClick={goToNextWeek} 
            sx={{ color: 'primary.main' }}
            size="large"
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selectedDays.size > 0 && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: 'secondary.50', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'secondary.main'
        }}>
          <Typography variant="body1" sx={{ color: 'secondary.dark', fontWeight: 500 }}>
            {selectedDays.size} day{selectedDays.size > 1 ? 's' : ''} selected for time off request
          </Typography>
          <Typography variant="caption" sx={{ color: 'secondary.dark', mt: 0.5, display: 'block' }}>
            💡 Tip: Hold Shift and click to select a range of consecutive days
          </Typography>
        </Box>
      )}

      {/* Two Week View - Responsive Layout */}
      <Grid container spacing={{ xs: 0, sm: 0, lg: 3 }} sx={{ width: '100%', justifyContent: 'center' }}>
        {/* Week 1 */}
        <Grid item xs={12} lg={6} sx={{ mb: { xs: 4, lg: 0 }, minWidth: 0 }}>
          {renderWeek(firstWeek, 'Week 1', false)}
        </Grid>
        
        {/* Week 2 */}
        <Grid item xs={12} lg={6} sx={{ mb: { xs: 4, lg: 0 }, minWidth: 0 }}>
          {renderWeek(secondWeek, 'Week 2', true)}
        </Grid>
      </Grid>
      
      {/* Legend */}
      <Box sx={{ 
        mt: 3, 
        p: { xs: 2, sm: 3 }, 
        backgroundColor: 'grey.50', 
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 2, sm: 3 },
        justifyContent: { xs: 'flex-start', sm: 'center' }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            backgroundColor: 'error.light', 
            borderRadius: 1, 
            mr: 1 
          }} />
          <Typography variant="body2">Holidays</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            backgroundColor: '#FFB3BA40', 
            border: '1px solid #FFB3BA80',
            borderRadius: 1, 
            mr: 1 
          }} />
          <Typography variant="body2">Time Off</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            backgroundColor: 'secondary.light', 
            borderRadius: 1, 
            mr: 1 
          }} />
          <Typography variant="body2">Selected Days</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            backgroundColor: 'grey.200', 
            borderRadius: 1, 
            mr: 1 
          }} />
          <Typography variant="body2">Weekends</Typography>
        </Box>
      </Box>

      {/* Floating Action Button for Time Off Request */}
      {selectedDays.size > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={openSummaryModal}
        >
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
            {selectedDays.size}
          </Typography>
        </Fab>
      )}

      {/* Time Off Summary Modal */}
      <Dialog 
        open={summaryModalOpen} 
        onClose={closeSummaryModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Time Off Request Summary</Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={closeSummaryModal}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Time off request submitted successfully!
            </Alert>
          )}
          
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You have selected <strong>{selectedDays.size}</strong> day{selectedDays.size > 1 ? 's' : ''} for time off:
            </Typography>
          </Box>

          {/* Time Off Type Selector */}
          <TextField
            select
            label="Type of Time Off"
            value={timeOffType}
            onChange={(e) => setTimeOffType(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            disabled={submitting}
          >
            <MenuItem value="vacation">Vacation</MenuItem>
          </TextField>

          {/* Notes Field */}
          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional details..."
            sx={{ mb: 3 }}
            disabled={submitting}
          />

          <Paper elevation={0} sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected Dates:
            </Typography>
            <List dense>
              {sortedSelectedDates.map((date, index) => (
                <Box key={format(date, 'yyyy-MM-dd')}>
                  <ListItem>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 2,
                        backgroundColor: 'secondary.main',
                        fontSize: '0.875rem'
                      }}
                    >
                      {format(date, 'd')}
                    </Avatar>
                    <ListItemText
                      primary={format(date, 'EEEE, MMMM d, yyyy')}
                      secondary={`Week ${getWeek(date, { weekStartsOn: 1 })}`}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        color: 'primary.dark'
                      }}
                    />
                    <Chip 
                      label={format(date, 'EEE')}
                      size="small"
                      sx={{ 
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        fontWeight: 600
                      }}
                    />
                  </ListItem>
                  {index < sortedSelectedDates.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Tip:</strong> Your request will be submitted as "pending" and requires approval.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={closeSummaryModal}
            variant="outlined"
            startIcon={<Close />}
            disabled={submitting}
          >
            Close
          </Button>
          <Button 
            onClick={clearSelectedDays}
            variant="outlined"
            color="secondary"
            startIcon={<Clear />}
            disabled={submitting}
          >
            Clear All
          </Button>
          <Button 
            onClick={handleSubmitTimeOff}
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Check />}
            sx={{ ml: 1 }}
            disabled={submitting || submitSuccess}
          >
            {submitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Request Confirmation Dialog */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={cancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: 'warning.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Cancel Time Off?</Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={cancelDelete}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {requestToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to cancel this time off request?
              </Typography>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {format(parseISO(requestToDelete.start_date), 'MMM d, yyyy')}
                  {requestToDelete.start_date !== requestToDelete.end_date && 
                    ` - ${format(parseISO(requestToDelete.end_date), 'MMM d, yyyy')}`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Status:</strong> {requestToDelete.status}
                </Typography>
                {requestToDelete.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Notes:</strong> {requestToDelete.notes}
                  </Typography>
                )}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. Only pending requests can be cancelled.
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={cancelDelete}
            variant="outlined"
          >
            Keep Request
          </Button>
          <Button 
            onClick={confirmDeleteRequest}
            variant="contained"
            color="error"
            startIcon={<Clear />}
          >
            Cancel Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CalendarView;