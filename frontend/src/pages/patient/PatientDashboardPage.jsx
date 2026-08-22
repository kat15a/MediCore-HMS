import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, Grid, Stack, Typography } from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import EmptyState from '../../components/common/EmptyState';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import labReportService from '../../services/labReportService';
import billingService from '../../services/billingService';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.profileId) return;
    let mounted = true;

    Promise.all([
      appointmentService.getByPatient(user.profileId, { size: 100, sort: 'appointmentDate,asc' }),
      prescriptionService.getByPatient(user.profileId, { size: 1 }),
      labReportService.getByPatient(user.profileId, { size: 100 }),
      billingService.getByPatient(user.profileId, { size: 100 }),
    ])
      .then(([appointmentsPage, prescriptionsPage, labReportsPage, billsPage]) => {
        if (!mounted) return;
        const upcoming = appointmentsPage.content
          .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status))
          .slice(0, 5);
        const pendingLabReports = labReportsPage.content.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
        const outstandingBalance = billsPage.content.reduce((sum, b) => sum + Number(b.balanceDue || 0), 0);

        setStats({
          upcoming,
          upcomingCount: appointmentsPage.content.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status)).length,
          prescriptionCount: prescriptionsPage.totalElements,
          pendingLabReports,
          outstandingBalance,
        });
      })
      .catch(() => enqueueSnackbar('Could not load your dashboard', { variant: 'error' }))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  if (loading) {
    return (
      <Box>
        <PageHeader title={`Welcome back, ${user?.firstName ?? ''}`} subtitle="Here's what's happening with your care." />
        <StatCardSkeleton count={4} />
        <Box sx={{ mt: 4 }}><CardSkeleton count={1} /></Box>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 28 } }}>Welcome back, {user?.firstName ?? ''}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Here's what's happening with your care.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/patient/appointments" variant="contained">
          Book Appointment
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Upcoming Appointments" value={stats.upcomingCount} icon={EventAvailableOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Prescriptions" value={stats.prescriptionCount} icon={DescriptionOutlinedIcon} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Lab Reports Pending" value={stats.pendingLabReports} icon={ScienceOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Balance Due" value={`$${stats.outstandingBalance.toFixed(2)}`} icon={PaymentsOutlinedIcon} tone="secondary" />
        </Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Upcoming Appointments</Typography>
          <Button component={RouterLink} to="/patient/appointments" size="small" endIcon={<ArrowForwardIcon />}>
            View all
          </Button>
        </Stack>
        {stats.upcoming.length === 0 ? (
          <EmptyState
            title="Nothing on the calendar"
            description="Book a visit and it will show up here."
          />
        ) : (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {stats.upcoming.map((a) => (
              <Stack key={a.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.75 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Dr. {a.doctorName} — {a.departmentName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.appointmentDate} at {a.appointmentTime}
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
