import { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Menu, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';
import departmentService from '../../services/departmentService';
import doctorService from '../../services/doctorService';

const STATUS_TRANSITIONS = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

export default function ReceptionistAppointmentsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const [bookOpen, setBookOpen] = useState(false);
  const [patientOptions, setPatientOptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      setRows(await appointmentService.getTodaysAppointments());
    } catch {
      enqueueSnackbar('Could not load appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { departmentService.getAll().then(setDepartments).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedDept) { setDoctors([]); return; }
    doctorService.getByDepartment(selectedDept.id).then(setDoctors).catch(() => {});
  }, [selectedDept]);

  const searchPatients = async (query) => {
    if (!query || query.length < 2) return;
    try { setPatientOptions(await patientService.search(query)); } catch { /* best-effort */ }
  };

  const openBooking = () => {
    setSelectedPatient(null);
    setSelectedDept(null);
    setSelectedDoctor(null);
    setDate('');
    setTime('');
    setReason('');
    setBookOpen(true);
  };

  const submitBooking = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDept || !date || !time) {
      enqueueSnackbar('Fill in patient, department, doctor, date, and time', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await appointmentService.book({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        departmentId: selectedDept.id,
        appointmentDate: date,
        appointmentTime: time,
        reason,
      });
      enqueueSnackbar('Appointment booked', { variant: 'success' });
      setBookOpen(false);
      loadAppointments();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not book this appointment', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openMenu = (event, row) => { setMenuAnchor(event.currentTarget); setMenuRow(row); };
  const closeMenu = () => { setMenuAnchor(null); setMenuRow(null); };

  const changeStatus = async (status) => {
    const row = menuRow;
    closeMenu();
    try {
      await appointmentService.updateStatus(row.id, status);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      enqueueSnackbar(`Marked ${status.replace('_', ' ').toLowerCase()}`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update status', { variant: 'error' });
    }
  };

  const columns = [
    { field: 'appointmentTime', headerName: 'Time', width: 90, renderCell: (p) => p.value?.slice(0, 5) },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 160 },
    { field: 'departmentName', headerName: 'Department', flex: 1, minWidth: 140 },
    { field: 'queueNumber', headerName: 'Queue #', width: 90, renderCell: (p) => p.value ?? '—' },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <AppointmentStatusChip status={p.value} /> },
    {
      field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => openMenu(e, params.row)}><MoreVertOutlinedIcon fontSize="small" /></IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Appointments"
        subtitle="Book new appointments and manage today's schedule."
        actionLabel="Book Appointment"
        actionIcon={<AddOutlinedIcon />}
        onAction={openBooking}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
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
          <MenuItem key={status} onClick={() => changeStatus(status)}>Mark as {status.replace('_', ' ').toLowerCase()}</MenuItem>
        ))}
      </Menu>

      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName} — ${o.email}`}
              value={selectedPatient}
              onChange={(_, val) => setSelectedPatient(val)}
              onInputChange={(_, val) => searchPatients(val)}
              renderInput={(params) => <TextField {...params} label="Search patient" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />
            <Autocomplete
              options={departments}
              getOptionLabel={(o) => o.name}
              value={selectedDept}
              onChange={(_, val) => { setSelectedDept(val); setSelectedDoctor(null); }}
              renderInput={(params) => <TextField {...params} label="Department" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />
            <Autocomplete
              options={doctors}
              getOptionLabel={(o) => `Dr. ${o.firstName} ${o.lastName}`}
              value={selectedDoctor}
              onChange={(_, val) => setSelectedDoctor(val)}
              disabled={!selectedDept}
              renderInput={(params) => <TextField {...params} label="Doctor" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
              <TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={time} onChange={(e) => setTime(e.target.value)} />
            </Stack>
            <TextField label="Reason for visit" fullWidth multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitBooking} disabled={saving}>{saving ? 'Booking…' : 'Book Appointment'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
