import { useEffect, useState } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;
    dashboardService
      .getDoctorDashboard(user.profileId)
      .then((data) => setAppointments(data.todaysAppointments ?? []))
      .catch(() => enqueueSnackbar("Could not load today's patients", { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  return (
    <Box>
      <PageHeader title="Today's Patients" subtitle="Everyone on your schedule for today, in order." />
      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <Box sx={{ p: 3 }}><CardSkeleton count={3} /></Box>
        ) : appointments.length ? (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {appointments.map((appt) => (
              <Stack key={appt.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
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
          <EmptyState title="No patients today" description="Your schedule for today is clear." />
        )}
      </Card>
    </Box>
  );
}
