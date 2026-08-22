import { useEffect, useState } from 'react';
import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;
    let mounted = true;
    dashboardService
      .getDoctorDashboard(user.profileId)
      .then((data) => mounted && setStats(data))
      .catch(() => enqueueSnackbar('Could not load your dashboard', { variant: 'error' }))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  if (loading) {
    return (
      <Box>
        <PageHeader title={`Welcome, Dr. ${user?.lastName ?? ''}`} subtitle="Here's your day at a glance." />
        <StatCardSkeleton count={3} />
        <Box sx={{ mt: 4 }}>
          <CardSkeleton count={3} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={`Welcome, Dr. ${user?.lastName ?? ''}`} subtitle="Here's your day at a glance." />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Today's Patients" value={stats?.todaysPatientCount ?? 0} icon={EventAvailableOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Upcoming" value={stats?.upcomingAppointmentCount ?? 0} icon={HourglassEmptyOutlinedIcon} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Completed Today" value={stats?.completedTodayCount ?? 0} icon={TaskAltOutlinedIcon} tone="primary" />
        </Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Today's Schedule
        </Typography>
        {stats?.todaysAppointments?.length ? (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {stats.todaysAppointments.map((appt) => (
              <Stack key={appt.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.75 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', width: 56 }} color="text.secondary">
                    {appt.appointmentTime?.slice(0, 5)}
                  </Typography>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{appt.patientName}</Typography>
                    <Typography variant="caption" color="text.secondary">{appt.reason || 'No reason provided'}</Typography>
                  </Box>
                </Stack>
                <AppointmentStatusChip status={appt.status} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <EmptyState title="No appointments today" description="Enjoy the quiet — your schedule is clear." />
        )}
      </Card>
    </Box>
  );
}
