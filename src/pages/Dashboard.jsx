import { 
  Box, 
  Paper, 
} from '@mui/material';
import CalendarView from '../components/Calendar/CalendarView';

function Dashboard() {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Paper sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        borderRadius: 3,
        maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '100%', xl: '1700px' },
        mx: 'auto'
      }}>
        <CalendarView />
      </Paper>
    </Box>
  );
}

export default Dashboard;