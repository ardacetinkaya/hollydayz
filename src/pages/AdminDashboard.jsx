import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import {
  Check,
  Close,
  Visibility,
  AdminPanelSettings
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../config/supabaseClient';
import { isUserAdmin } from '../utils/adminUtils';

function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    checkAdminAccess();
    if (user) {
      loadAllRequests();
      loadUsersAndProjects();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (user) {
      const adminStatus = await isUserAdmin(user);
      setIsAdmin(adminStatus);
    }
  };

  const loadUsersAndProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, project')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Extract unique users and projects
      setUsers(data || []);
      const uniqueProjects = [...new Set(data?.map(u => u.project).filter(p => p))];
      setProjects(uniqueProjects);
    } catch (err) {
      // Silent fail - filters are optional
    }
  };

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      // Get all requests (not just a date range)
      const allRequests = await supabaseService.getAllTimeOffRequests();
      setRequests(allRequests || []);
    } catch (err) {
      setError('Failed to load time-off requests');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleOpenActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes('');
    setActionModalOpen(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      
      await supabaseService.updateTimeOffRequestStatus(
        selectedRequest.id,
        newStatus,
        user.id,
        actionNotes
      );

      setSuccess(`Request ${newStatus} successfully!`);
      setActionModalOpen(false);
      setActionNotes('');
      
      // Reload requests
      await loadAllRequests();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update request: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const filterRequests = (status) => {
    let filtered = status === 'all' ? requests : requests.filter(req => req.status === status);
    
    // Apply user filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(req => req.user_id === selectedUser);
    }
    
    // Apply project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(req => req.user?.project === selectedProject);
    }
    
    return filtered;
  };

  const getFilteredRequests = () => {
    switch (currentTab) {
      case 0: return filterRequests('pending');
      case 1: return filterRequests('approved');
      case 2: return filterRequests('rejected');
      case 3: return filterRequests('all');
      default: return requests;
    }
  };
  
  // Calculate total days for filtered requests
  const getTotalDays = (requests) => {
    return requests.reduce((total, req) => {
      const days = differenceInDays(parseISO(req.end_date), parseISO(req.start_date)) + 1;
      return total + days;
    }, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading requests...</Typography>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You do not have permission to access this page. Only administrators can manage time-off requests.
        </Alert>
      </Container>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminPanelSettings sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Time-Off Management
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ minWidth: 100 }}
          >
            Back
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Tabs for filtering */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label={`Pending (${filterRequests('pending').length})`} />
            <Tab label={`Approved (${filterRequests('approved').length})`} />
            <Tab label={`Rejected (${filterRequests('rejected').length})`} />
            <Tab label={`All (${requests.length})`} />
          </Tabs>
        </Box>

        {/* Filters Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by User</InputLabel>
              <Select
                value={selectedUser}
                label="Filter by User"
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <MenuItem value="all">All Users</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Project</InputLabel>
              <Select
                value={selectedProject}
                label="Filter by Project"
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project} value={project}>
                    {project}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.5, bgcolor: 'primary.lighter' }}>
              <Typography variant="body2" color="text.secondary">
                Total Days: <strong>{getTotalDays(filteredRequests)}</strong>
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Requests Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Start Date</strong></TableCell>
                <TableCell><strong>End Date</strong></TableCell>
                <TableCell><strong>Days</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const days = differenceInDays(
                    parseISO(request.end_date),
                    parseISO(request.start_date)
                  ) + 1;

                  return (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {request.user?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.user?.email || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(request.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(request.end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{days} day{days > 1 ? 's' : ''}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.type}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          size="small"
                          color={getStatusColor(request.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(request)}
                          title="View Details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {request.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenActionModal(request, 'approve')}
                              title="Approve"
                            >
                              <Check fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenActionModal(request, 'reject')}
                              title="Reject"
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Employee:</strong> {selectedRequest.user?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {selectedRequest.user?.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Project:</strong> {selectedRequest.user?.project || 'N/A'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Start Date:</strong> {format(parseISO(selectedRequest.start_date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>End Date:</strong> {format(parseISO(selectedRequest.end_date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total Days:</strong> {differenceInDays(parseISO(selectedRequest.end_date), parseISO(selectedRequest.start_date)) + 1} days
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Type:</strong> {selectedRequest.type}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> <Chip label={selectedRequest.status} size="small" color={getStatusColor(selectedRequest.status)} />
              </Typography>
              {selectedRequest.notes && (
                <Typography variant="body2" gutterBottom>
                  <strong>Notes:</strong> {selectedRequest.notes}
                </Typography>
              )}
              <Typography variant="body2" gutterBottom>
                <strong>Requested on:</strong> {format(parseISO(selectedRequest.created_at), 'MMM d, yyyy HH:mm')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve/Reject Modal */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Time-Off Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Employee:</strong> {selectedRequest.user?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Dates:</strong> {format(parseISO(selectedRequest.start_date), 'MMM d')} - {format(parseISO(selectedRequest.end_date), 'MMM d, yyyy')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (optional)"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add any notes for this decision..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApproveReject}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboard;
