import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import appointmentService from '../../services/appointmentService';
import departmentService from '../../services/departmentService';
import doctorService from '../../services/doctorService';

const emptyBooking = { departmentId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '' };

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bookOpen, setBookOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyBooking);
  const [saving, setSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      const page = await appointmentService.getByPatient(user.profileId, { size: 100, sort: 'appointmentDate,desc' });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load your appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, [user?.profileId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { departmentService.getAll().then(setDepartments).catch(() => {}); }, []);

  useEffect(() => {
    if (!form.departmentId) { setDoctors([]); return; }
    doctorService.getByDepartment(form.departmentId).then(setDoctors).catch(() => {});
  }, [form.departmentId]);

  const openBooking = () => {
    setForm(emptyBooking);
    setBookOpen(true);
  };

  const submitBooking = async () => {
    if (!form.departmentId || !form.doctorId || !form.appointmentDate || !form.appointmentTime) {
      enqueueSnackbar('Fill in department, doctor, date, and time', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await appointmentService.book({ patientId: user.profileId, ...form });
      enqueueSnackbar('Appointment requested — you\'ll be notified once it\'s confirmed', { variant: 'success' });
      setBookOpen(false);
      loadAppointments();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not book this appointment', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await appointmentService.cancel(cancelTarget.id, 'Cancelled by patient');
      enqueueSnackbar('Appointment cancelled', { variant: 'success' });
      setCancelTarget(null);
      loadAppointments();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not cancel this appointment', { variant: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { field: 'appointmentDate', headerName: 'Date', width: 120 },
    { field: 'appointmentTime', headerName: 'Time', width: 100 },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 160 },
    { field: 'departmentName', headerName: 'Department', flex: 1, minWidth: 140 },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => <AppointmentStatusChip status={params.value} />,
    },
    {
      field: 'actions', headerName: '', width: 110, sortable: false,
      renderCell: (params) => (
        ['PENDING', 'CONFIRMED'].includes(params.row.status) ? (
          <Button size="small" color="error" onClick={() => setCancelTarget(params.row)}>Cancel</Button>
        ) : null
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="My Appointments"
        subtitle="Book a new visit or manage your upcoming appointments."
        actionLabel="Book Appointment"
        actionIcon={<AddOutlinedIcon />}
        onAction={openBooking}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : rows.length === 0 ? (
          <EmptyState title="No appointments yet" description="Book your first appointment to get started." />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
        )}
      </Card>

      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book an Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              select label="Department" fullWidth value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, doctorId: '' }))}
            >
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
            <TextField
              select label="Doctor" fullWidth value={form.doctorId} disabled={!form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
              helperText={!form.departmentId ? 'Choose a department first' : ''}
            >
              {doctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialization}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.appointmentDate}
                onChange={(e) => setForm((f) => ({ ...f, appointmentDate: e.target.value }))}
              />
              <TextField
                label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={form.appointmentTime}
                onChange={(e) => setForm((f) => ({ ...f, appointmentTime: e.target.value }))}
              />
            </Stack>
            <TextField
              label="Reason for visit (optional)" fullWidth multiline minRows={2} value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <Typography variant="caption" color="text.secondary">
              Your appointment will be marked pending until the front desk confirms it.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitBooking} disabled={saving}>
            {saving ? 'Booking…' : 'Book Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel appointment?"
        message={`Cancel your appointment on ${cancelTarget?.appointmentDate} at ${cancelTarget?.appointmentTime}?`}
        confirmLabel="Cancel Appointment"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </Box>
  );
}
