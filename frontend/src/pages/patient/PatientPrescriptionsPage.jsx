import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import prescriptionService from '../../services/prescriptionService';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!user?.profileId) return;
    prescriptionService
      .getByPatient(user.profileId, { size: 100, sort: 'createdAt,desc' })
      .then((page) => setRows(page.content))
      .catch(() => enqueueSnackbar('Could not load your prescriptions', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const columns = [
    { field: 'createdAt', headerName: 'Date', width: 140, renderCell: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 160, renderCell: (p) => `Dr. ${p.value}` },
    { field: 'diagnosis', headerName: 'Diagnosis', flex: 1.4, minWidth: 200 },
    {
      field: 'items', headerName: 'Medicines', flex: 1, minWidth: 130,
      renderCell: (p) => <Chip label={`${p.value?.length ?? 0} item(s)`} size="small" variant="outlined" />,
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false,
      renderCell: (params) => (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => setDetail(params.row)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Prescriptions" subtitle="Everything your doctors have prescribed, in one place." />
      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : rows.length === 0 ? (
          <EmptyState title="No prescriptions yet" description="Prescriptions from your visits will appear here." />
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

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Prescription from Dr. {detail?.doctorName}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Diagnosis</Typography>
                <Typography variant="body2">{detail.diagnosis || '—'}</Typography>
              </Box>
              {detail.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{detail.notes}</Typography>
                </Box>
              )}
              <Divider />
              <Typography variant="subtitle2">Medicines</Typography>
              {detail.items?.length ? detail.items.map((it) => (
                <Stack key={it.id} spacing={0.25}>
                  <Typography variant="body2" fontWeight={600}>{it.medicineName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {it.dosage} · {it.frequency} {it.durationDays ? `· ${it.durationDays} days` : ''}
                  </Typography>
                  {it.instructions && (
                    <Typography variant="caption" color="text.secondary">{it.instructions}</Typography>
                  )}
                </Stack>
              )) : <Typography variant="body2" color="text.secondary">No medicines listed.</Typography>}

              {detail.aiSummary && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="secondary.dark" fontWeight={600}>
                      AI SUMMARY — WHAT THIS MEANS FOR YOU
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{detail.aiSummary}</Typography>
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
