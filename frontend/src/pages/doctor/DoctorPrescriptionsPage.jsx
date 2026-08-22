import { useEffect, useState } from 'react';
import { Box, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import prescriptionService from '../../services/prescriptionService';

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!user?.profileId) return;
    prescriptionService
      .getByDoctor(user.profileId, { size: 100, sort: 'createdAt,desc' })
      .then((page) => setRows(page.content))
      .catch(() => enqueueSnackbar('Could not load prescriptions', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const columns = [
    { field: 'createdAt', headerName: 'Date', width: 160, renderCell: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'diagnosis', headerName: 'Diagnosis', flex: 1.4, minWidth: 200 },
    {
      field: 'items', headerName: 'Medicines', flex: 1, minWidth: 140,
      renderCell: (p) => <Chip label={`${p.value?.length ?? 0} item(s)`} size="small" variant="outlined" />,
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
      <PageHeader title="Prescriptions" subtitle="Every prescription you've written." />
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

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Prescription — {detail?.patientName}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Diagnosis</Typography>
                <Typography variant="body2">{detail.diagnosis || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography variant="body2">{detail.notes || '—'}</Typography>
              </Box>
              <Divider />
              <Typography variant="subtitle2">Medicines</Typography>
              {detail.items?.map((it) => (
                <Stack key={it.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{it.medicineName} — {it.dosage}, {it.frequency}</Typography>
                  <Typography variant="caption" color="text.secondary">{it.durationDays ? `${it.durationDays}d` : ''}</Typography>
                </Stack>
              ))}
              {detail.aiSummary && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">AI Summary</Typography>
                    <Typography variant="body2">{detail.aiSummary}</Typography>
                  </Box>
                </>
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
