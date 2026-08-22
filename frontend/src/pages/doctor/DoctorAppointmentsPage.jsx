import { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import medicineService from '../../services/medicineService';

const STATUS_FLOW = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};
const STATUS_ACTION_LABEL = { PENDING: 'Confirm', CONFIRMED: 'Start Visit', IN_PROGRESS: 'Complete' };

const emptyItem = { medicineId: '', dosage: '', frequency: '', durationDays: '', instructions: '' };

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);

  const [rxTarget, setRxTarget] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      const page = await appointmentService.getByDoctor(user.profileId, { size: 100, sort: 'appointmentDate,desc' });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load your appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.profileId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { medicineService.getAll().then(setMedicines).catch(() => {}); }, []);

  const advanceStatus = async (row) => {
    const next = STATUS_FLOW[row.status];
    if (!next) return;
    try {
      await appointmentService.updateStatus(row.id, next);
      enqueueSnackbar(`Marked as ${next.replace('_', ' ').toLowerCase()}`, { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update status', { variant: 'error' });
    }
  };

  const openPrescription = (row) => {
    setRxTarget(row);
    setDiagnosis('');
    setNotes('');
    setItems([{ ...emptyItem }]);
  };

  const updateItem = (i, field, value) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submitPrescription = async () => {
    if (items.some((it) => !it.medicineId)) {
      enqueueSnackbar('Select a medicine for every line', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await prescriptionService.create({
        appointmentId: rxTarget.id,
        diagnosis,
        notes,
        items: items.map((it) => ({ ...it, durationDays: it.durationDays ? Number(it.durationDays) : undefined })),
      });
      enqueueSnackbar('Prescription saved', { variant: 'success' });
      setRxTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not save the prescription', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: 'appointmentDate', headerName: 'Date', width: 110 },
    { field: 'appointmentTime', headerName: 'Time', width: 90, renderCell: (p) => p.value?.slice(0, 5) },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'reason', headerName: 'Reason', flex: 1.2, minWidth: 180 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <AppointmentStatusChip status={p.value} /> },
    {
      field: 'actions', headerName: '', width: 220, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {STATUS_FLOW[params.row.status] && (
            <Button size="small" variant="outlined" onClick={() => advanceStatus(params.row)}>
              {STATUS_ACTION_LABEL[params.row.status]}
            </Button>
          )}
          <Tooltip title="Write prescription">
            <IconButton size="small" onClick={() => openPrescription(params.row)}><DescriptionOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Appointments" subtitle="Your full schedule — advance status and write prescriptions from here." />

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

      <Dialog open={Boolean(rxTarget)} onClose={() => setRxTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Prescription for {rxTarget?.patientName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Diagnosis" fullWidth multiline minRows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            <TextField label="Notes" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

            <Typography variant="subtitle2">Medicines</Typography>
            {items.map((item, i) => (
              <Grid container spacing={1.5} key={i} alignItems="center">
                <Grid item xs={4}>
                  <Autocomplete
                    size="small"
                    options={medicines}
                    getOptionLabel={(o) => o.name || ''}
                    onChange={(_, val) => updateItem(i, 'medicineId', val?.id ?? '')}
                    renderInput={(params) => <TextField {...params} label="Medicine" />}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField size="small" label="Dosage" fullWidth value={item.dosage} onChange={(e) => updateItem(i, 'dosage', e.target.value)} />
                </Grid>
                <Grid item xs={3}>
                  <TextField size="small" label="Frequency" fullWidth value={item.frequency} onChange={(e) => updateItem(i, 'frequency', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <TextField size="small" label="Days" type="number" fullWidth value={item.durationDays} onChange={(e) => updateItem(i, 'durationDays', e.target.value)} />
                </Grid>
                <Grid item xs={1}>
                  <IconButton size="small" onClick={() => removeItem(i)} disabled={items.length === 1}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Grid>
                <Grid item xs={12}>
                  <TextField size="small" label="Instructions (e.g. after food)" fullWidth value={item.instructions} onChange={(e) => updateItem(i, 'instructions', e.target.value)} />
                </Grid>
              </Grid>
            ))}
            <Button size="small" onClick={addItem} startIcon={<AddOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>Add medicine</Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRxTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitPrescription} disabled={saving}>{saving ? 'Saving…' : 'Save Prescription'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
