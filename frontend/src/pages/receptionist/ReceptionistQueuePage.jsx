import { useEffect, useState } from 'react';
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import AppointmentStatusChip from '../../components/common/AppointmentStatusChip';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import appointmentService from '../../services/appointmentService';

const NEXT_STATUS = { PENDING: 'CONFIRMED', CONFIRMED: 'IN_PROGRESS' };
const NEXT_LABEL = { PENDING: 'Check In', CONFIRMED: 'Send to Doctor' };

export default function ReceptionistQueuePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const todays = await appointmentService.getTodaysAppointments();
      const active = todays
        .filter((a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status))
        .sort((a, b) => (a.queueNumber ?? 999) - (b.queueNumber ?? 999));
      setRows(active);
    } catch {
      enqueueSnackbar('Could not load the queue', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = async (row) => {
    const next = NEXT_STATUS[row.status];
    if (!next) return;
    try {
      await appointmentService.updateStatus(row.id, next);
      enqueueSnackbar(`${row.patientName} moved to ${next.replace('_', ' ').toLowerCase()}`, { variant: 'success' });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update the queue', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Queue" subtitle="Live check-in queue for today." />
        <CardSkeleton count={4} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Queue" subtitle="Live check-in queue for today." />
      <Card>
        {rows.length ? (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} spacing={0}>
            {rows.map((row) => (
              <Stack key={row.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', width: 36 }} color="text.secondary">
                    #{row.queueNumber ?? '—'}
                  </Typography>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{row.patientName}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.doctorName} · {row.departmentName}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AppointmentStatusChip status={row.status} />
                  {NEXT_STATUS[row.status] && (
                    <Button size="small" variant="outlined" onClick={() => advance(row)}>{NEXT_LABEL[row.status]}</Button>
                  )}
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <EmptyState title="Queue is empty" description="No one is currently waiting." />
        )}
      </Card>
    </Box>
  );
}
