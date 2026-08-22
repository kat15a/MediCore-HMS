import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, Grid, Stack, Typography } from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import EmptyState from '../../components/common/EmptyState';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import appointmentService from '../../services/appointmentService';
import roomService from '../../services/roomService';

export default function ReceptionistDashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([appointmentService.getTodaysAppointments(), roomService.getAll()])
      .then(([appointments, rooms]) => {
        if (!mounted) return;
        const waiting = appointments.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status));
        const availableBeds = rooms.reduce((sum, r) => sum + Math.max(r.capacity - r.occupiedBeds, 0), 0);
        setStats({
          todaysCount: appointments.length,
          waitingCount: waiting.length,
          availableBeds,
          totalBeds: rooms.reduce((sum, r) => sum + r.capacity, 0),
          upcoming: appointments.slice(0, 6),
        });
      })
      .catch(() => enqueueSnackbar('Could not load the front-desk overview', { variant: 'error' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Front Desk" subtitle="Today at a glance." />
        <StatCardSkeleton count={3} />
        <Box sx={{ mt: 4 }}><CardSkeleton count={1} /></Box>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 28 } }}>Front Desk</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Today at a glance.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button component={RouterLink} to="/receptionist/patients/new" variant="outlined" startIcon={<PersonAddAlt1OutlinedIcon />}>
            Register Patient
          </Button>
          <Button component={RouterLink} to="/receptionist/appointments" variant="contained" startIcon={<EventAvailableOutlinedIcon />}>
            Book Appointment
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Today's Appointments" value={stats.todaysCount} icon={EventAvailableOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Patients Waiting" value={stats.waitingCount} icon={HourglassEmptyOutlinedIcon} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Beds Available" value={`${stats.availableBeds}/${stats.totalBeds}`} icon={BedOutlinedIcon} tone="primary" />
        </Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Today's Schedule</Typography>
        {stats.upcoming.length === 0 ? (
          <EmptyState title="Nothing scheduled today" description="Booked appointments for today will show up here." />
        ) : (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {stats.upcoming.map((a) => (
              <Stack key={a.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.75 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{a.patientName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.appointmentTime} · Dr. {a.doctorName} · {a.departmentName}
                  </Typography>
                </Box>
                <AppointmentStatusChip status={a.status} />
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}
