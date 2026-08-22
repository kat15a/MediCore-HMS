import { useEffect, useState } from 'react';
import { Box, Card, Chip, Grid, Stack, Typography } from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import dashboardService from '../../services/dashboardService';

const CHART_COLORS = ['#1F6F5C', '#EFA857', '#DDE5E2'];

export default function AdminDashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardService
      .getAdminDashboard()
      .then((data) => mounted && setStats(data))
      .catch(() => enqueueSnackbar('Could not load dashboard statistics', { variant: 'error' }))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Admin Dashboard" subtitle="Hospital-wide overview, live." />
        <StatCardSkeleton count={6} />
        <Box sx={{ mt: 4 }}>
          <CardSkeleton count={2} />
        </Box>
      </Box>
    );
  }

  if (!stats) {
    return <EmptyState title="Dashboard unavailable" description="Couldn't reach the server. Try refreshing the page." />;
  }

  const appointmentChartData = [
    { name: 'Pending', value: stats.pendingAppointmentCount },
    { name: 'Completed', value: stats.completedAppointmentCount },
    { name: 'Other', value: Math.max(stats.todaysAppointmentCount - stats.pendingAppointmentCount - stats.completedAppointmentCount, 0) },
  ];

  const bedData = [
    { name: 'Occupied', value: Math.max(stats.totalBeds - stats.availableBeds, 0) },
    { name: 'Available', value: stats.availableBeds },
  ];

  return (
    <Box>
      <PageHeader title="Admin Dashboard" subtitle="Hospital-wide overview, live." />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard label="Total Patients" value={stats.totalPatients} icon={PeopleOutlineIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard label="Total Doctors" value={stats.totalDoctors} icon={LocalHospitalOutlinedIcon} tone="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard label="Today's Appointments" value={stats.todaysAppointmentCount} icon={EventAvailableOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Today's Revenue"
            value={`$${Number(stats.todaysRevenue ?? 0).toLocaleString()}`}
            icon={PaymentsOutlinedIcon}
            tone="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard label="Beds Available" value={`${stats.availableBeds}/${stats.totalBeds}`} icon={BedOutlinedIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard label="Low Stock Items" value={stats.lowStockMedicineCount} icon={MedicationOutlinedIcon} tone="secondary" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Today's Appointments
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={appointmentChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {appointmentChartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
              {appointmentChartData.map((d, i) => (
                <Stack key={d.name} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <Typography variant="caption" color="text.secondary">{d.name} ({d.value})</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Bed Occupancy
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bedData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#1F6F5C" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Recent Activity
        </Typography>
        {stats.recentActivities?.length ? (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {stats.recentActivities.map((activity, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Chip
                    label={activity.entityType || 'System'}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11 }}
                  />
                  <Typography variant="body2" noWrap>
                    {activity.action} {activity.entityId ? `#${activity.entityId}` : ''} — {activity.performedBy}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"IBM Plex Mono", monospace', flexShrink: 0, ml: 2 }}>
                  {activity.timestamp}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <EmptyState title="No recent activity" description="Actions across the hospital will show up here." />
        )}
      </Card>
    </Box>
  );
}
