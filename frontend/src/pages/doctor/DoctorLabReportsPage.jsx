import { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import labReportService from '../../services/labReportService';
import laboratoryService from '../../services/laboratoryService';
import patientService from '../../services/patientService';

const STATUS_COLOR = { REQUESTED: 'default', SAMPLE_COLLECTED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'default' };

export default function DoctorLabReportsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [detail, setDetail] = useState(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      const page = await labReportService.getByDoctor(user.profileId, { size: 100, sort: 'requestedAt,desc' });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load lab reports', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.profileId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { laboratoryService.getAll().then(setLabs).catch(() => {}); }, []);

  const searchPatients = async (query) => {
    if (!query || query.length < 2) return;
    try { setPatientOptions(await patientService.search(query)); } catch { /* best-effort */ }
  };

  const openRequest = () => {
    setSelectedPatient(null);
    setSelectedLab(null);
    setRequestOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedPatient || !selectedLab) {
      enqueueSnackbar('Select a patient and a test', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await labReportService.request({
        patientId: selectedPatient.id,
        doctorId: user.profileId,
        laboratoryId: selectedLab.id,
      });
      enqueueSnackbar('Lab test requested', { variant: 'success' });
      setRequestOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not request the test', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: 'requestedAt', headerName: 'Requested', width: 160, renderCell: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'testName', headerName: 'Test', flex: 1, minWidth: 160 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => <Chip label={p.value.replace('_', ' ')} size="small" color={STATUS_COLOR[p.value]} /> },
    {
      field: 'isAbnormal', headerName: 'Result', width: 110,
      renderCell: (p) => (p.row.status === 'COMPLETED' ? <Chip label={p.value ? 'Abnormal' : 'Normal'} size="small" color={p.value ? 'error' : 'success'} /> : '—'),
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false,
      renderCell: (params) => (
        <Tooltip title="View"><IconButton size="small" onClick={() => setDetail(params.row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Lab Reports"
        subtitle="Request tests and review results for your patients."
        actionLabel="Request Test"
        actionIcon={<AddOutlinedIcon />}
        onAction={openRequest}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
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

      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Lab Test</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
              value={selectedPatient}
              onChange={(_, val) => setSelectedPatient(val)}
              onInputChange={(_, val) => searchPatients(val)}
              renderInput={(params) => <TextField {...params} label="Search patient" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />
            <Autocomplete
              options={labs}
              getOptionLabel={(o) => o.testName}
              value={selectedLab}
              onChange={(_, val) => setSelectedLab(val)}
              renderInput={(params) => <TextField {...params} label="Test" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRequestOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={saving}>{saving ? 'Requesting…' : 'Request'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.testName} — {detail?.patientName}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">Status: {detail.status.replace('_', ' ')}</Typography>
              {detail.resultSummary && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Result Summary</Typography>
                  <Typography variant="body2">{detail.resultSummary}</Typography>
                </Box>
              )}
              {detail.aiSummary && (
                <Box>
                  <Typography variant="caption" color="text.secondary">AI Summary</Typography>
                  <Typography variant="body2">{detail.aiSummary}</Typography>
                </Box>
              )}
              {!detail.resultSummary && !detail.aiSummary && (
                <Typography variant="body2" color="text.secondary">No results uploaded yet.</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
