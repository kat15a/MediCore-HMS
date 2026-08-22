import { useEffect, useState } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import appointmentService from '../../services/appointmentService';

const STATUS_TRANSITIONS = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

export default function AdminAppointmentsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const todays = await appointmentService.getTodaysAppointments();
      setRows(todays);
    } catch {
      enqueueSnackbar('Could not load appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMenu = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const changeStatus = async (status) => {
    const row = menuRow;
    closeMenu();
    try {
      await appointmentService.updateStatus(row.id, status);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      enqueueSnackbar(`Appointment marked ${status.replace('_', ' ').toLowerCase()}`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update status', { variant: 'error' });
    }
  };

  const columns = [
    { field: 'appointmentTime', headerName: 'Time', width: 90, valueFormatter: (p) => p.value?.slice(0, 5) },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 160 },
    { field: 'departmentName', headerName: 'Department', flex: 1, minWidth: 140 },
    {
      field: 'queueNumber',
      headerName: 'Queue #',
      width: 90,
      renderCell: (params) =>
        params.value ? (
          <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>{params.value}</Typography>
        ) : (
          '—'
        ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => <AppointmentStatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => openMenu(e, params.row)}>
          <MoreVertOutlinedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Today's Appointments" subtitle="Every appointment scheduled for today, across all doctors." />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
            <Typography variant="subtitle1" fontWeight={600}>No appointments today</Typography>
            <Typography variant="body2" color="text.secondary">The board is clear for now.</Typography>
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
        )}
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {STATUS_TRANSITIONS.filter((s) => s !== menuRow?.status).map((status) => (
          <MenuItem key={status} onClick={() => changeStatus(status)}>
            Mark as {status.replace('_', ' ').toLowerCase()}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
