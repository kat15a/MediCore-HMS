import { useEffect, useState } from 'react';
import { Box, Button, Card, Chip, Grid, Stack, Typography } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import roomService from '../../services/roomService';

const STATUS_COLOR = { AVAILABLE: 'success', OCCUPIED: 'warning', MAINTENANCE: 'default' };

export default function ReceptionistRoomsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadRooms = async () => {
    setLoading(true);
    try {
      setRooms(await roomService.getAll());
    } catch {
      enqueueSnackbar('Could not load rooms', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAllocate = async (room) => {
    setBusyId(room.id);
    try {
      await roomService.allocate(room.id);
      enqueueSnackbar(`Bed allocated in room ${room.roomNumber}`, { variant: 'success' });
      loadRooms();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not allocate a bed', { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRelease = async (room) => {
    setBusyId(room.id);
    try {
      await roomService.release(room.id);
      enqueueSnackbar(`Bed released in room ${room.roomNumber}`, { variant: 'success' });
      loadRooms();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not release a bed', { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Room Allocation" subtitle="Admit and discharge patients into available beds." />
        <CardSkeleton count={3} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Room Allocation" subtitle="Admit and discharge patients into available beds." />

      {rooms.length === 0 ? (
        <Card sx={{ p: 3 }}><EmptyState title="No rooms configured" description="Ask an administrator to add rooms." /></Card>
      ) : (
        <Grid container spacing={2.5}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BedOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>Room {room.roomNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{room.roomType.replace('_', ' ')} · Floor {room.floor || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Chip label={room.status} size="small" color={STATUS_COLOR[room.status]} variant={STATUS_COLOR[room.status] === 'default' ? 'outlined' : 'filled'} />
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {room.occupiedBeds} / {room.capacity} beds occupied · ${Number(room.dailyRate).toFixed(0)}/day
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small" variant="outlined" startIcon={<PersonAddOutlinedIcon />}
                    disabled={busyId === room.id || room.occupiedBeds >= room.capacity || room.status === 'MAINTENANCE'}
                    onClick={() => handleAllocate(room)}
                  >
                    Admit
                  </Button>
                  <Button
                    size="small" variant="outlined" color="secondary" startIcon={<PersonRemoveOutlinedIcon />}
                    disabled={busyId === room.id || room.occupiedBeds <= 0}
                    onClick={() => handleRelease(room)}
                  >
                    Discharge
                  </Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
