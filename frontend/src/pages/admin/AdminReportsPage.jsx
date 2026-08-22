import { useEffect, useState } from 'react';
import { Box, Button, Card, Grid, Stack, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import Papa from 'papaparse';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { StatCardSkeleton } from '../../components/common/LoadingSkeleton';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import dashboardService from '../../services/dashboardService';

export default function AdminReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getAdminDashboard()
      .then(setStats)
      .catch(() => enqueueSnackbar('Could not load report data', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportSummaryCsv = () => {
    if (!stats) return;
    const summaryRows = [
      { metric: 'Total Patients', value: stats.totalPatients },
      { metric: 'Total Doctors', value: stats.totalDoctors },
      { metric: 'Total Receptionists', value: stats.totalReceptionists },
      { metric: "Today's Appointments", value: stats.todaysAppointmentCount },
      { metric: 'Pending Appointments', value: stats.pendingAppointmentCount },
      { metric: 'Completed Appointments', value: stats.completedAppointmentCount },
      { metric: "Today's Revenue", value: stats.todaysRevenue },
      { metric: 'Available Beds', value: `${stats.availableBeds}/${stats.totalBeds}` },
      { metric: 'Low Stock Medicines', value: stats.lowStockMedicineCount },
    ];
    const csv = Papa.unparse(summaryRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medicore-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportActivityCsv = () => {
    if (!stats?.recentActivities?.length) {
      enqueueSnackbar('No activity to export yet', { variant: 'info' });
      return;
    }
    const csv = Papa.unparse(stats.recentActivities);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medicore-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Reports" subtitle="Export hospital-wide summaries for offline review." />
        <StatCardSkeleton count={6} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Export hospital-wide summaries for offline review." />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Total Patients" value={stats.totalPatients} icon={PeopleOutlineIcon} /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Total Doctors" value={stats.totalDoctors} icon={LocalHospitalOutlinedIcon} tone="secondary" /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Today's Appointments" value={stats.todaysAppointmentCount} icon={EventAvailableOutlinedIcon} /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Today's Revenue" value={`$${Number(stats.todaysRevenue ?? 0).toLocaleString()}`} icon={PaymentsOutlinedIcon} tone="secondary" /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Beds Available" value={`${stats.availableBeds}/${stats.totalBeds}`} icon={BedOutlinedIcon} /></Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}><StatCard label="Low Stock Items" value={stats.lowStockMedicineCount} icon={MedicationOutlinedIcon} tone="secondary" /></Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>Export</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Download the current snapshot as a CSV file you can open in Excel or Sheets.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportSummaryCsv}>
            Export Summary CSV
          </Button>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportActivityCsv}>
            Export Recent Activity CSV
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
