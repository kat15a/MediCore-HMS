import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Link, Stack, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import labReportService from '../../services/labReportService';

const STATUS_COLOR = {
  REQUESTED: 'default', SAMPLE_COLLECTED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'default',
};

export default function PatientLabReportsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!user?.profileId) return;
    labReportService
      .getByPatient(user.profileId, { size: 100, sort: 'requestedAt,desc' })
      .then((page) => setRows(page.content))
      .catch(() => enqueueSnackbar('Could not load your lab reports', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const columns = [
    { field: 'requestedAt', headerName: 'Requested', width: 140, renderCell: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'testName', headerName: 'Test', flex: 1, minWidth: 160 },
    { field: 'doctorName', headerName: 'Requested By', flex: 1, minWidth: 150, renderCell: (p) => p.value || '—' },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (p) => <Chip label={p.value.replace('_', ' ')} size="small" color={STATUS_COLOR[p.value]} variant={STATUS_COLOR[p.value] === 'default' ? 'outlined' : 'filled'} />,
    },
    {
      field: 'isAbnormal', headerName: '', width: 60,
      renderCell: (p) => p.value ? (
        <Tooltip title="Abnormal result"><WarningAmberOutlinedIcon fontSize="small" color="error" /></Tooltip>
      ) : null,
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false,
      renderCell: (params) => (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => setDetail(params.row)} disabled={params.row.status !== 'COMPLETED'}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Lab Reports" subtitle="Track requested tests and read your results in plain language." />
      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="No lab reports yet" description="Tests your doctor orders will show up here." />
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
        <DialogTitle>{detail?.testName}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              {detail.isAbnormal && (
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.main', color: '#fff' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WarningAmberOutlinedIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>
                      This result includes values outside the normal range. Discuss with your doctor.
                    </Typography>
                  </Stack>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Result Summary</Typography>
                <Typography variant="body2">{detail.resultSummary || 'No summary provided yet.'}</Typography>
              </Box>
              {detail.aiSummary && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="secondary.dark" fontWeight={600}>
                      AI SUMMARY — IN PLAIN LANGUAGE
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{detail.aiSummary}</Typography>
                  </Box>
                </>
              )}
              {detail.reportFileUrl && (
                <Link href={detail.reportFileUrl} target="_blank" rel="noopener">
                  View original report file
                </Link>
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
